"use server";

import { createClient } from "@/lib/supabase/server";
import { getActiveBan, getCurrentUserProfile } from "@/lib/profile";
import { validateMessageSafety } from "@/lib/safety/filter";
import { checkRateLimit } from "@/lib/safety/rate-limit";
import { asUuid, toSafeErrorMessage } from "@/lib/validation";

export interface SendMessageResult {
  error?: string | null;
  success?: boolean;
  message?: {
    id: string;
    room_id: string;
    user_id: string;
    content: string;
    created_at: string;
  };
}

/** Maximum length of a public room message (matches the database constraint). */
const MAX_ROOM_MESSAGE_LENGTH = 2000;

/**
 * Sends a message in a public room with server-side validation and anti-spam rules.
 */
export async function sendRoomMessage(
  roomId: string,
  content: string
): Promise<SendMessageResult> {
  const roomUuid = asUuid(roomId);
  if (!roomUuid) {
    return { error: "الغرفة غير صالحة." };
  }

  const trimmed = typeof content === "string" ? content.trim() : "";

  if (!trimmed || trimmed.length === 0) {
    return { error: "لا يمكن إرسال رسالة فارغة." };
  }

  if (trimmed.length > MAX_ROOM_MESSAGE_LENGTH) {
    return {
      error: `الرسالة طويلة جداً (الحد الأقصى ${MAX_ROOM_MESSAGE_LENGTH} حرف).`,
    };
  }

  const { user, profile, supabase } = await getCurrentUserProfile();

  if (!user || !profile) {
    return { error: "يجب تسجيل الدخول للمشاركة في الغرفة." };
  }

  // Rate limiting check
  const rateLimit = checkRateLimit(user.id, "roomMessage");
  if (!rateLimit.allowed) {
    return {
      error: `أنت ترسل الرسائل بسرعة كبيرة. يرجى الانتظار ${rateLimit.retryAfterSeconds} ثانية.`,
    };
  }

  const safetyCheck = validateMessageSafety(trimmed, MAX_ROOM_MESSAGE_LENGTH);
  if (!safetyCheck.isAllowed) {
    return { error: safetyCheck.reason };
  }

  // Run room & ban checks in parallel for maximum speed
  const [{ data: room, error: roomError }, ban] = await Promise.all([
    supabase.from("rooms").select("id, is_active").eq("id", roomUuid).maybeSingle(),
    getActiveBan(supabase, user.id),
  ]);

  if (roomError || !room || !room.is_active) {
    return { error: "هذه الغرفة غير متاحة حالياً." };
  }

  if (ban.banned) {
    return { error: `الحساب محظور من المشاركة: ${ban.reason ?? "مخالفة قواعد المجتمع"}` };
  }

  const { data, error } = await supabase
    .from("room_messages")
    .insert({
      room_id: roomUuid,
      user_id: user.id,
      content: safetyCheck.cleanedText,
    })
    .select("id, room_id, user_id, content, created_at")
    .single();

  if (error) {
    return {
      error: toSafeErrorMessage(
        error,
        "حدث خطأ أثناء إرسال الرسالة. يرجى المحاولة لاحقاً."
      ),
    };
  }

  return { success: true, message: data };
}

/**
 * Deletes a message if the caller is the author or an admin.
 */
export async function deleteRoomMessage(
  messageId: string
): Promise<{ error?: string | null; success?: boolean }> {
  const messageUuid = asUuid(messageId);
  if (!messageUuid) {
    return { error: "الرسالة غير صالحة." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "غير مصرح." };
  }

  const { data, error } = await supabase
    .from("room_messages")
    .delete()
    .eq("id", messageUuid)
    .select("id");

  if (error) {
    console.error("[sohba] room message delete failed:", error.message);
    return { error: "تعذر حذف الرسالة." };
  }

  if (!data || data.length === 0) {
    return { error: "الرسالة غير موجودة أو لا تملك صلاحية حذفها." };
  }

  return { success: true };
}
