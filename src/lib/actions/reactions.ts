"use server";

import { createClient } from "@/lib/supabase/server";

export interface ReactionState {
  error?: string;
  success?: boolean;
}

/**
 * Toggle a reaction on a room message.
 * If user already reacted with this emoji, removes it.
 * Otherwise, inserts the reaction.
 */
export async function toggleRoomMessageReaction(
  messageId: string,
  emoji: string
): Promise<ReactionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "يجب تسجيل الدخول للتفاعل مع الرسائل." };
  }

  // Check if reaction already exists
  const { data: existing } = await supabase
    .from("room_message_reactions")
    .select("id")
    .eq("message_id", messageId)
    .eq("user_id", user.id)
    .eq("emoji", emoji)
    .maybeSingle();

  if (existing) {
    const { error: deleteError } = await supabase
      .from("room_message_reactions")
      .delete()
      .eq("id", existing.id);

    if (deleteError) {
      return { error: deleteError.message };
    }
  } else {
    const { error: insertError } = await supabase
      .from("room_message_reactions")
      .insert({
        message_id: messageId,
        user_id: user.id,
        emoji,
      });

    if (insertError) {
      return { error: insertError.message };
    }
  }

  return { success: true };
}

/**
 * Pin or unpin a message in a room.
 * Restricted to administrators only.
 */
export async function pinRoomMessage(
  roomId: string,
  messageId: string | null
): Promise<ReactionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "غير مصرح لك بتثبيت الرسائل." };
  }

  // Check admin role
  const { data: adminRole } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "admin")
    .maybeSingle();

  if (!adminRole) {
    return { error: "عذراً، تثبيت الرسائل متاح للمشرف فقط." };
  }

  const { error } = await supabase
    .from("rooms")
    .update({ pinned_message_id: messageId })
    .eq("id", roomId);

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}
