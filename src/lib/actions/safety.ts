"use server";

import { getCurrentUserProfile } from "@/lib/profile";
import { checkRateLimit } from "@/lib/safety/rate-limit";
import { revalidatePath } from "next/cache";
import { asUuid, stripControlCharacters, toSafeErrorMessage } from "@/lib/validation";

export interface SafetyActionResult {
  success?: boolean;
  error?: string | null;
}

export interface BlockedUserItem {
  id: string;
  blockedId: string;
  nickname: string;
  avatarUrl: string | null;
  gender: string | null;
  blockedAt: string;
}

/** Maximum length of the report reason. */
const MAX_REASON_LENGTH = 200;
/** Maximum length of the report details. */
const MAX_DETAILS_LENGTH = 1000;

const REPORT_TARGET_TYPES = ["user", "message", "room"] as const;

/**
 * Blocks a target user.
 * Immediately hides profiles and blocks messages mutually in accordance with Phase 1 rules.
 */
export async function blockUser(targetUserId: string): Promise<SafetyActionResult> {
  const targetUuid = asUuid(targetUserId);
  if (!targetUuid) {
    return { error: "المستخدم المستهدف غير صالح." };
  }

  const { user, supabase } = await getCurrentUserProfile();

  if (!user) {
    return { error: "يجب تسجيل الدخول للقيام بهذا الإجراء." };
  }

  if (user.id === targetUuid) {
    return { error: "لا يمكنك حظر نفسك." };
  }

  // Rate limiting to avoid automated block spam.
  const rateLimit = checkRateLimit(user.id, "block");
  if (!rateLimit.allowed) {
    return {
      error: "تم تنفيذ عدد كبير من عمليات الحظر مؤخراً. يرجى الانتظار قليلاً.",
    };
  }

  // Already blocked? Nothing to do.
  const { data: existingBlock } = await supabase
    .from("blocks")
    .select("id")
    .eq("blocker_id", user.id)
    .eq("blocked_id", targetUuid)
    .maybeSingle();

  if (existingBlock) {
    return { success: true };
  }

  // Insert block.
  // The profile of the target can be hidden by a mutual block, so existence is
  // enforced by the foreign key of the blocks table instead of a profile read.
  const { error } = await supabase.from("blocks").insert({
    blocker_id: user.id,
    blocked_id: targetUuid,
  });

  if (error) {
    if (error.code === "23505") {
      // Unique constraint violation: already blocked
      return { success: true };
    }
    if (error.code === "23503") {
      return { error: "المستخدم غير موجود." };
    }
    return {
      error: toSafeErrorMessage(
        error,
        "حدث خطأ أثناء حظر المستخدم. يرجى المحاولة لاحقاً."
      ),
    };
  }

  revalidatePath("/discover");
  revalidatePath("/messages");
  revalidatePath("/rooms");
  revalidatePath(`/profile/${targetUuid}`);
  revalidatePath("/settings");

  return { success: true };
}

/**
 * Unblocks a previously blocked user.
 */
export async function unblockUser(targetUserId: string): Promise<SafetyActionResult> {
  const targetUuid = asUuid(targetUserId);
  if (!targetUuid) {
    return { error: "المستخدم المستهدف غير صالح." };
  }

  const { user, supabase } = await getCurrentUserProfile();

  if (!user) {
    return { error: "يجب تسجيل الدخول للقيام بهذا الإجراء." };
  }

  const { error } = await supabase
    .from("blocks")
    .delete()
    .eq("blocker_id", user.id)
    .eq("blocked_id", targetUuid);

  if (error) {
    console.error("[sohba] unblock failed:", error.message);
    return { error: "تعذر إلغاء الحظر. يرجى المحاولة لاحقاً." };
  }

  revalidatePath("/discover");
  revalidatePath("/messages");
  revalidatePath("/rooms");
  revalidatePath(`/profile/${targetUuid}`);
  revalidatePath("/settings");

  return { success: true };
}

/**
 * Submits an official abuse report against a user, message, or room.
 */
export async function reportTarget(
  targetType: "user" | "message" | "room",
  targetId: string,
  reason: string,
  details?: string
): Promise<SafetyActionResult> {
  if (!REPORT_TARGET_TYPES.includes(targetType)) {
    return { error: "نوع البلاغ غير صالح." };
  }

  const targetUuid = asUuid(targetId);
  if (!targetUuid) {
    return { error: "الهدف المبلّغ عنه غير صالح." };
  }

  const { user, supabase } = await getCurrentUserProfile();

  if (!user) {
    return { error: "يجب تسجيل الدخول لتقديم بلاغ." };
  }

  const trimmedReason = stripControlCharacters(reason?.trim() ?? "");
  if (!trimmedReason) {
    return { error: "يرجى تحديد سبب البلاغ." };
  }

  if (trimmedReason.length > MAX_REASON_LENGTH) {
    return { error: `سبب البلاغ طويل جداً (الحد الأقصى ${MAX_REASON_LENGTH} حرف).` };
  }

  const trimmedDetails = details?.trim()
    ? stripControlCharacters(details.trim())
    : null;
  if (trimmedDetails && trimmedDetails.length > MAX_DETAILS_LENGTH) {
    return {
      error: `تفاصيل البلاغ يجب ألا تتجاوز ${MAX_DETAILS_LENGTH} حرف.`,
    };
  }

  // Rate limiting to prevent report spamming
  const rateLimit = checkRateLimit(user.id, "report");
  if (!rateLimit.allowed) {
    return {
      error: `لقد تجاوزت الحد المسموح به للبلاغات. يرجى الانتظار ${rateLimit.retryAfterSeconds} ثانية.`,
    };
  }

  const { error } = await supabase.from("reports").insert({
    reporter_id: user.id,
    target_type: targetType,
    target_id: targetUuid,
    reason: trimmedReason,
    details: trimmedDetails,
    status: "pending",
  });

  if (error) {
    return {
      error: toSafeErrorMessage(error, "حدث خطأ أثناء إرسال البلاغ. يرجى المحاولة لاحقاً."),
    };
  }

  return { success: true };
}

/**
 * Fetches the list of users blocked by the currently authenticated user.
 */
export async function getBlockedUsers(): Promise<BlockedUserItem[]> {
  const { user, supabase } = await getCurrentUserProfile();

  if (!user) return [];

  const { data: blocks, error: blocksError } = await supabase
    .from("blocks")
    .select("id, blocked_id, created_at")
    .eq("blocker_id", user.id)
    .order("created_at", { ascending: false });

  if (blocksError) {
    console.error("[sohba] blocked users lookup failed:", blocksError.message);
    return [];
  }

  if (!blocks || blocks.length === 0) return [];

  const blockedIds = blocks.map((b) => b.blocked_id);

  // The database policy allows a user to see the basic profile of the people
  // they blocked, so the list stays readable without exposing any private data.
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, nickname, avatar_url, gender")
    .in("id", blockedIds);

  const profileMap = new Map((profiles || []).map((p) => [p.id, p]));

  return blocks.map((b) => {
    const prof = profileMap.get(b.blocked_id);
    return {
      id: b.id,
      blockedId: b.blocked_id,
      nickname: prof?.nickname || "مستخدم محظور",
      avatarUrl: prof?.avatar_url || null,
      gender: prof?.gender || null,
      blockedAt: b.created_at,
    };
  });
}
