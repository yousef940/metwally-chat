"use server";

import { getActiveBan, getCurrentUserProfile } from "@/lib/profile";
import { revalidatePath } from "next/cache";
import { validateMessageSafety } from "@/lib/safety/filter";
import { checkRateLimit } from "@/lib/safety/rate-limit";
import { asUuid, toSafeErrorMessage } from "@/lib/validation";

export interface MessageActionResult {
  error?: string | null;
  success?: boolean;
  conversationId?: string | null;
  message?: {
    id: string;
    conversation_id: string;
    sender_id: string;
    content: string;
    is_read: boolean;
    created_at: string;
  };
}

/** Maximum length of the first message of a chat request. */
const MAX_REQUEST_MESSAGE_LENGTH = 1000;
/** Maximum length of a private message (matches the database constraint). */
const MAX_PRIVATE_MESSAGE_LENGTH = 5000;

/**
 * Sends a chat request to initiate a new private conversation.
 * In accordance with Phase 1 safety rules, users cannot message directly
 * without the receiver first accepting the chat request.
 */
export async function sendChatRequest(
  receiverId: string,
  initialMessage: string
): Promise<MessageActionResult> {
  const receiverUuid = asUuid(receiverId);
  if (!receiverUuid) {
    return { error: "المستخدم المستهدف غير صالح." };
  }

  const trimmed = typeof initialMessage === "string" ? initialMessage.trim() : "";

  if (!trimmed || trimmed.length === 0) {
    return { error: "يرجى كتابة رسالة تمهيدية لطلب المحادثة." };
  }

  if (trimmed.length > MAX_REQUEST_MESSAGE_LENGTH) {
    return { error: "الرسالة التمهيدية يجب ألا تتجاوز 1000 حرف." };
  }

  const { user, profile, supabase } = await getCurrentUserProfile();

  if (!user || !profile) {
    return { error: "يجب تسجيل الدخول لإرسال طلب محادثة." };
  }

  if (user.id === receiverUuid) {
    return { error: "لا يمكنك إرسال طلب محادثة لنفسك." };
  }

  // Rate limiting check
  const rateLimit = checkRateLimit(user.id, "chatRequest");
  if (!rateLimit.allowed) {
    return {
      error: `لقد أرسلت عدة طلبات محادثة مؤخراً. يرجى الانتظار ${Math.ceil(
        (rateLimit.retryAfterSeconds || 60) / 60
      )} دقيقة قبل إرسال طلب جديد.`,
    };
  }

  // Safety & profanity check
  const safetyCheck = validateMessageSafety(trimmed, MAX_REQUEST_MESSAGE_LENGTH);
  if (!safetyCheck.isAllowed) {
    return { error: safetyCheck.reason };
  }

  // The sender must not be banned.
  const ban = await getActiveBan(supabase, user.id);
  if (ban.banned) {
    return { error: `الحساب محظور من استخدام المنصة: ${ban.reason ?? "مخالفة قواعد المجتمع"}` };
  }

  // Check if mutual block exists between sender and receiver
  const { data: isBlocked } = await supabase.rpc("is_blocked", {
    user_a: user.id,
    user_b: receiverUuid,
  });

  if (isBlocked) {
    return { error: "لا يمكن إرسال طلب محادثة لهذا المستخدم بسبب قيود الخصوصية أو الحظر." };
  }

  // The receiver must exist and must not be banned.
  const { data: receiver, error: receiverError } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", receiverUuid)
    .maybeSingle();

  if (receiverError) {
    console.error("[sohba] receiver lookup failed:", receiverError.message);
    return { error: "تعذر التحقق من المستلم، يرجى المحاولة لاحقاً." };
  }

  if (!receiver) {
    return { error: "المستخدم غير موجود." };
  }

  const { data: receiverIsBanned } = await supabase.rpc("is_banned", {
    check_user_id: receiverUuid,
  });

  if (receiverIsBanned) {
    return { error: "لا يمكن إرسال طلب محادثة إلى هذا الحساب حالياً." };
  }

  // Check if a conversation already exists
  const p1 = user.id < receiverUuid ? user.id : receiverUuid;
  const p2 = user.id < receiverUuid ? receiverUuid : user.id;

  const { data: existingConv } = await supabase
    .from("conversations")
    .select("id")
    .eq("participant_one", p1)
    .eq("participant_two", p2)
    .maybeSingle();

  if (existingConv) {
    return {
      success: true,
      conversationId: existingConv.id,
    };
  }

  // Check if a pending or accepted chat request already exists.
  // Both ids are validated UUIDs, so the filter string cannot be tampered with.
  const { data: existingRequest } = await supabase
    .from("chat_requests")
    .select("id, status")
    .or(
      `and(sender_id.eq.${user.id},receiver_id.eq.${receiverUuid}),and(sender_id.eq.${receiverUuid},receiver_id.eq.${user.id})`
    )
    .maybeSingle();

  if (existingRequest) {
    if (existingRequest.status === "pending") {
      return { error: "يوجد طلب محادثة معلق بالفعل بينكما بانتظار الرد." };
    }
    if (existingRequest.status === "accepted") {
      return { success: true };
    }
  }

  // Insert chat request
  const { error } = await supabase.from("chat_requests").insert({
    sender_id: user.id,
    receiver_id: receiverUuid,
    initial_message: trimmed,
    status: "pending",
  });

  if (error) {
    return {
      error: toSafeErrorMessage(
        error,
        "حدث خطأ أثناء إرسال طلب المحادثة. يرجى المحاولة لاحقاً."
      ),
    };
  }

  revalidatePath("/messages");
  revalidatePath(`/profile/${receiverUuid}`);

  return { success: true };
}

/**
 * Responds to an incoming chat request (Accept or Decline).
 * If accepted, the conversation is provisioned and the initial message is
 * stored inside it.
 */
export async function respondToChatRequest(
  requestId: string,
  action: "accept" | "decline"
): Promise<MessageActionResult> {
  const requestUuid = asUuid(requestId);
  if (!requestUuid) {
    return { error: "طلب المحادثة غير صالح." };
  }

  if (action !== "accept" && action !== "decline") {
    return { error: "إجراء غير معروف." };
  }

  const { user, supabase } = await getCurrentUserProfile();

  if (!user) {
    return { error: "يجب تسجيل الدخول لإتمام هذا الإجراء." };
  }

  // Fetch the request (only incoming requests of the current user are visible)
  const { data: request, error: fetchErr } = await supabase
    .from("chat_requests")
    .select("id, sender_id, receiver_id, initial_message, status")
    .eq("id", requestUuid)
    .eq("receiver_id", user.id)
    .maybeSingle();

  if (fetchErr || !request) {
    return { error: "طلب المحادثة غير موجود أو غير مخصص لك." };
  }

  if (request.status !== "pending") {
    return { error: "تمت معالجة هذا الطلب مسبقاً." };
  }

  if (action === "decline") {
    const { error: updateErr } = await supabase
      .from("chat_requests")
      .update({ status: "declined", updated_at: new Date().toISOString() })
      .eq("id", requestUuid);

    if (updateErr) {
      console.error("[sohba] decline chat request failed:", updateErr.message);
      return { error: "تعذر رفض الطلب في الوقت الحالي." };
    }

    revalidatePath("/messages");
    return { success: true };
  }

  // Action is accept: provision the conversation.
  // The database function is the only safe way to insert the first message
  // under the sender's identity (Row Level Security only lets a user write
  // their own messages).
  const { data: conversationId, error: rpcError } = await supabase.rpc(
    "accept_chat_request",
    { p_request_id: requestUuid }
  );

  if (rpcError) {
    console.error("[sohba] accept_chat_request failed:", rpcError.code, rpcError.message);

    // Fallback for databases that do not have the helper function yet:
    // create the conversation and mark the request as accepted.
    if (rpcError.code === "PGRST202" || rpcError.code === "42883") {
      const senderId = request.sender_id;
      const p1 = senderId < user.id ? senderId : user.id;
      const p2 = senderId < user.id ? user.id : senderId;

      const { data: conversation, error: convErr } = await supabase
        .from("conversations")
        .upsert(
          {
            participant_one: p1,
            participant_two: p2,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "participant_one,participant_two" }
        )
        .select("id")
        .single();

      if (convErr || !conversation) {
        return { error: "تعذر إنشاء المحادثة. يرجى المحاولة لاحقاً." };
      }

      await supabase
        .from("chat_requests")
        .update({ status: "accepted", updated_at: new Date().toISOString() })
        .eq("id", requestUuid);

      revalidatePath("/messages");
      revalidatePath(`/messages/${conversation.id}`);

      return { success: true, conversationId: conversation.id };
    }

    return {
      error: toSafeErrorMessage(rpcError, "تعذر قبول طلب المحادثة. يرجى المحاولة لاحقاً."),
    };
  }

  revalidatePath("/messages");
  revalidatePath(`/messages/${conversationId}`);

  return { success: true, conversationId: conversationId as string };
}

/**
 * Sends a message in an existing 1-to-1 conversation.
 */
export async function sendPrivateMessage(
  conversationId: string,
  content: string
): Promise<MessageActionResult> {
  const conversationUuid = asUuid(conversationId);
  if (!conversationUuid) {
    return { error: "المحادثة غير صالحة." };
  }

  const trimmed = typeof content === "string" ? content.trim() : "";

  if (!trimmed || trimmed.length === 0) {
    return { error: "لا يمكن إرسال رسالة فارغة." };
  }

  if (trimmed.length > MAX_PRIVATE_MESSAGE_LENGTH) {
    return {
      error: `الرسالة طويلة جداً (الحد الأقصى ${MAX_PRIVATE_MESSAGE_LENGTH} حرف).`,
    };
  }

  const { user, supabase } = await getCurrentUserProfile();

  if (!user) {
    return { error: "يجب تسجيل الدخول لإرسال الرسائل." };
  }

  // Rate limiting check
  const rateLimit = checkRateLimit(user.id, "directMessage");
  if (!rateLimit.allowed) {
    return {
      error: `أنت ترسل الرسائل بسرعة كبيرة. يرجى الانتظار ${rateLimit.retryAfterSeconds} ثانية.`,
    };
  }

  // Safety & profanity check
  const safetyCheck = validateMessageSafety(trimmed, MAX_PRIVATE_MESSAGE_LENGTH);
  if (!safetyCheck.isAllowed) {
    return { error: safetyCheck.reason };
  }

  // Verify conversation membership and mutual block check
  const { data: conv, error: convErr } = await supabase
    .from("conversations")
    .select("id, participant_one, participant_two")
    .eq("id", conversationUuid)
    .maybeSingle();

  if (convErr || !conv) {
    return { error: "المحادثة غير موجودة أو غير مصرح لك بدخولها." };
  }

  if (conv.participant_one !== user.id && conv.participant_two !== user.id) {
    return { error: "غير مصرح لك بالإرسال في هذه المحادثة." };
  }

  const otherUserId =
    conv.participant_one === user.id ? conv.participant_two : conv.participant_one;

  const { data: isBlocked } = await supabase.rpc("is_blocked", {
    user_a: user.id,
    user_b: otherUserId,
  });

  if (isBlocked) {
    return { error: "لا يمكن إرسال الرسالة نظراً لوجود حظر بينك وبين الطرف الآخر." };
  }

  // Banned accounts cannot chat.
  const ban = await getActiveBan(supabase, user.id);
  if (ban.banned) {
    return { error: `الحساب محظور من استخدام المنصة: ${ban.reason ?? "مخالفة قواعد المجتمع"}` };
  }

  // Insert message
  const { data: newMsg, error: msgErr } = await supabase
    .from("messages")
    .insert({
      conversation_id: conversationUuid,
      sender_id: user.id,
      content: trimmed,
      is_read: false,
    })
    .select("id, conversation_id, sender_id, content, is_read, created_at")
    .single();

  if (msgErr) {
    return {
      error: toSafeErrorMessage(msgErr, "تعذر إرسال الرسالة. يرجى المحاولة لاحقاً."),
    };
  }

  // Update conversation updated_at
  const { error: convUpdateError } = await supabase
    .from("conversations")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", conversationUuid);

  if (convUpdateError) {
    console.error("[sohba] conversation touch failed:", convUpdateError.message);
  }

  return { success: true, message: newMsg };
}

/**
 * Marks all unread messages received by current user in this conversation as read.
 */
export async function markConversationAsRead(
  conversationId: string
): Promise<{ success: boolean }> {
  const conversationUuid = asUuid(conversationId);
  if (!conversationUuid) return { success: false };

  const { user, supabase } = await getCurrentUserProfile();

  if (!user) return { success: false };

  // Only participants can mark a conversation as read.
  const { data: conv } = await supabase
    .from("conversations")
    .select("id, participant_one, participant_two")
    .eq("id", conversationUuid)
    .maybeSingle();

  if (!conv) return { success: false };
  if (conv.participant_one !== user.id && conv.participant_two !== user.id) {
    return { success: false };
  }

  const { error } = await supabase
    .from("messages")
    .update({ is_read: true })
    .eq("conversation_id", conversationUuid)
    .neq("sender_id", user.id)
    .eq("is_read", false);

  if (error) {
    console.error("[sohba] mark as read failed:", error.message);
    return { success: false };
  }

  return { success: true };
}

/**
 * Toggles muting notifications for a conversation.
 */
export async function toggleMuteConversation(
  conversationId: string
): Promise<{ isMuted: boolean; error?: string }> {
  const conversationUuid = asUuid(conversationId);
  if (!conversationUuid) {
    return { isMuted: false, error: "المحادثة غير صالحة." };
  }

  const { user, supabase } = await getCurrentUserProfile();

  if (!user) return { isMuted: false, error: "يجب تسجيل الدخول أولاً." };

  // Muting is only allowed for conversations the user takes part in.
  const { data: conv } = await supabase
    .from("conversations")
    .select("id, participant_one, participant_two")
    .eq("id", conversationUuid)
    .maybeSingle();

  if (!conv) return { isMuted: false, error: "المحادثة غير موجودة." };
  if (conv.participant_one !== user.id && conv.participant_two !== user.id) {
    return { isMuted: false, error: "غير مصرح لك بهذه المحادثة." };
  }

  const { data: existingMute } = await supabase
    .from("conversation_mutes")
    .select("user_id")
    .eq("user_id", user.id)
    .eq("conversation_id", conversationUuid)
    .maybeSingle();

  if (existingMute) {
    // Unmute
    const { error } = await supabase
      .from("conversation_mutes")
      .delete()
      .eq("user_id", user.id)
      .eq("conversation_id", conversationUuid);

    if (error) {
      console.error("[sohba] unmute failed:", error.message);
      return { isMuted: true, error: "تعذر إلغاء الكتم." };
    }

    revalidatePath(`/messages/${conversationUuid}`);
    return { isMuted: false };
  }

  // Mute
  const { error: insertError } = await supabase.from("conversation_mutes").insert({
    user_id: user.id,
    conversation_id: conversationUuid,
  });

  if (insertError) {
    console.error("[sohba] mute failed:", insertError.message);
    return { isMuted: false, error: "تعذر كتم المحادثة." };
  }

  revalidatePath(`/messages/${conversationUuid}`);
  return { isMuted: true };
}
