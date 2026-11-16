"use server";

import { requireAdmin } from "@/lib/admin";
import { revalidatePath } from "next/cache";
import { asUuid, stripControlCharacters, toSafeErrorMessage } from "@/lib/validation";

export interface AdminActionResult {
  success?: boolean;
  error?: string | null;
}

export interface AdminStats {
  totalUsers: number;
  totalRooms: number;
  pendingReports: number;
  activeBans: number;
}

export interface EnrichedReport {
  id: string;
  reporterId: string;
  reporterNickname: string;
  reporterAvatar: string | null;
  targetType: "user" | "message" | "room";
  targetId: string;
  reason: string;
  details: string | null;
  status: "pending" | "investigating" | "resolved" | "dismissed";
  createdAt: string;
  resolvedAt: string | null;
  targetPreview?: {
    title?: string;
    content?: string;
    extra?: string;
  };
}

export interface BannedUserItem {
  id: string;
  userId: string;
  nickname: string;
  avatarUrl: string | null;
  reason: string;
  bannedUntil: string | null;
  createdAt: string;
  isPermanent: boolean;
  /** True while the ban is still in force (an expired ban is not active). */
  isActive?: boolean;
}

const REPORT_STATUSES = ["pending", "investigating", "resolved", "dismissed"] as const;
type ReportStatus = (typeof REPORT_STATUSES)[number];

/** Maximum length of the ban reason. */
const MAX_BAN_REASON_LENGTH = 500;
/** Maximum length of a room name. */
const MAX_ROOM_NAME_LENGTH = 80;
/** Maximum length of a room description. */
const MAX_ROOM_DESCRIPTION_LENGTH = 300;

/**
 * Fetches dashboard high-level moderation statistics.
 */
export async function getAdminStats(): Promise<AdminStats> {
  const { supabase } = await requireAdmin();

  const nowIso = new Date().toISOString();

  const [
    { count: usersCount },
    { count: roomsCount },
    { count: reportsCount },
    { count: bansCount },
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("rooms").select("*", { count: "exact", head: true }),
    supabase
      .from("reports")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending"),
    // Only bans that are still in force (permanent or not yet expired).
    supabase
      .from("bans")
      .select("*", { count: "exact", head: true })
      .or(`banned_until.is.null,banned_until.gt.${nowIso}`),
  ]);

  return {
    totalUsers: usersCount ?? 0,
    totalRooms: roomsCount ?? 0,
    pendingReports: reportsCount ?? 0,
    activeBans: bansCount ?? 0,
  };
}

/**
 * Fetches and enriches reports for the moderation panel.
 */
export async function getAdminReports(
  statusFilter?: string
): Promise<EnrichedReport[]> {
  const { supabase } = await requireAdmin();

  let query = supabase
    .from("reports")
    .select("*")
    .order("created_at", { ascending: false });

  if (statusFilter && statusFilter !== "all") {
    if (!REPORT_STATUSES.includes(statusFilter as ReportStatus)) {
      return [];
    }
    query = query.eq("status", statusFilter);
  }

  const { data: rawReports, error } = await query;
  if (error || !rawReports) return [];

  // Extract reporter IDs
  const reporterIds = Array.from(new Set(rawReports.map((r) => r.reporter_id)));
  const { data: reporterProfiles } = reporterIds.length
    ? await supabase
        .from("profiles")
        .select("id, nickname, avatar_url")
        .in("id", reporterIds)
    : { data: [] };

  const reporterMap = new Map(
    (reporterProfiles || []).map((p) => [p.id, p])
  );

  // Extract target IDs by type to enrich preview
  const userTargetIds = rawReports
    .filter((r) => r.target_type === "user")
    .map((r) => r.target_id)
    .filter((id) => Boolean(asUuid(id)));

  const roomMessageTargetIds = rawReports
    .filter((r) => r.target_type === "message")
    .map((r) => r.target_id)
    .filter((id) => Boolean(asUuid(id)));

  const roomTargetIds = rawReports
    .filter((r) => r.target_type === "room")
    .map((r) => r.target_id)
    .filter((id) => Boolean(asUuid(id)));

  // Parallel fetch target details
  const [
    { data: targetUserProfiles },
    { data: targetRoomMessages },
    { data: targetRooms },
  ] = await Promise.all([
    userTargetIds.length > 0
      ? supabase.from("profiles").select("id, nickname, country, city").in("id", userTargetIds)
      : Promise.resolve({ data: [] }),
    roomMessageTargetIds.length > 0
      ? supabase.from("room_messages").select("id, content, user_id").in("id", roomMessageTargetIds)
      : Promise.resolve({ data: [] }),
    roomTargetIds.length > 0
      ? supabase.from("rooms").select("id, name, slug").in("id", roomTargetIds)
      : Promise.resolve({ data: [] }),
  ]);

  const targetUsersMap = new Map((targetUserProfiles || []).map((p) => [p.id, p]));
  const targetMessagesMap = new Map((targetRoomMessages || []).map((m) => [m.id, m]));
  const targetRoomsMap = new Map((targetRooms || []).map((r) => [r.id, r]));

  return rawReports.map((r) => {
    const reporter = reporterMap.get(r.reporter_id);
    let targetPreview: EnrichedReport["targetPreview"] = undefined;

    if (r.target_type === "user") {
      const u = targetUsersMap.get(r.target_id);
      targetPreview = {
        title: u ? `المستخدم: ${u.nickname}` : "مستخدم محذوف أو غير موجود",
        extra: u ? `${u.country} - ${u.city}` : undefined,
      };
    } else if (r.target_type === "message") {
      const m = targetMessagesMap.get(r.target_id);
      targetPreview = {
        title: "رسالة في غرفة عامة",
        content: m ? m.content : "[تم حذف الرسالة بالفعل]",
      };
    } else if (r.target_type === "room") {
      const rm = targetRoomsMap.get(r.target_id);
      targetPreview = {
        title: rm ? `الغرفة: ${rm.name}` : "غرفة غير موجودة",
        extra: rm ? `slug: ${rm.slug}` : undefined,
      };
    }

    return {
      id: r.id,
      reporterId: r.reporter_id,
      reporterNickname: reporter?.nickname || "مستخدم غير معروف",
      reporterAvatar: reporter?.avatar_url || null,
      targetType: r.target_type as "user" | "message" | "room",
      targetId: r.target_id,
      reason: r.reason,
      details: r.details,
      status: r.status as ReportStatus,
      createdAt: r.created_at,
      resolvedAt: r.resolved_at,
      targetPreview,
    };
  });
}

/**
 * Updates a report's review status.
 */
export async function updateReportStatus(
  reportId: string,
  newStatus: "pending" | "investigating" | "resolved" | "dismissed"
): Promise<AdminActionResult> {
  const reportUuid = asUuid(reportId);
  if (!reportUuid) {
    return { error: "معرّف البلاغ غير صالح." };
  }

  if (!REPORT_STATUSES.includes(newStatus)) {
    return { error: "حالة البلاغ غير صالحة." };
  }

  const { user, supabase } = await requireAdmin();

  const updateData: Record<string, unknown> = {
    status: newStatus,
    reviewed_by: user.id,
  };

  if (newStatus === "resolved" || newStatus === "dismissed") {
    updateData.resolved_at = new Date().toISOString();
  } else {
    updateData.resolved_at = null;
  }

  const { error } = await supabase
    .from("reports")
    .update(updateData)
    .eq("id", reportUuid);

  if (error) {
    console.error("[sohba] update report status failed:", error.message);
    return { error: "فشل تحديث حالة البلاغ. يرجى المحاولة لاحقاً." };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/reports");
  return { success: true };
}

/**
 * Bans a user temporarily or permanently.
 */
export async function banUser(
  userId: string,
  reason: string,
  durationDays?: number | null
): Promise<AdminActionResult> {
  const userUuid = asUuid(userId);
  if (!userUuid) {
    return { error: "معرّف المستخدم غير صالح." };
  }

  const { user, supabase } = await requireAdmin();

  if (userUuid === user.id) {
    return { error: "لا يمكنك حظر حسابك الخاص." };
  }

  const trimmedReason = stripControlCharacters(reason?.trim() ?? "");
  if (!trimmedReason) {
    return { error: "يرجى توضيح سبب الحظر." };
  }

  if (trimmedReason.length > MAX_BAN_REASON_LENGTH) {
    return {
      error: `سبب الحظر طويل جداً (الحد الأقصى ${MAX_BAN_REASON_LENGTH} حرف).`,
    };
  }

  // The target must exist and must not be an administrator.
  const { data: target } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", userUuid)
    .maybeSingle();

  if (!target) {
    return { error: "المستخدم غير موجود." };
  }

  const { data: targetRole } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userUuid)
    .eq("role", "admin")
    .maybeSingle();

  if (targetRole) {
    return { error: "لا يمكن حظر حساب مسؤول." };
  }

  let bannedUntil: string | null = null;
  if (durationDays && durationDays > 0) {
    const days = Math.min(Math.floor(durationDays), 3650);
    const untilDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    bannedUntil = untilDate.toISOString();
  }

  // Replace any previous ban so a user never ends up with duplicate records.
  const { error: deleteError } = await supabase
    .from("bans")
    .delete()
    .eq("user_id", userUuid);

  if (deleteError) {
    console.error("[sohba] replace ban failed:", deleteError.message);
    return { error: "فشل تسجيل الحظر. يرجى المحاولة لاحقاً." };
  }

  const { error } = await supabase.from("bans").insert({
    user_id: userUuid,
    reason: trimmedReason,
    banned_until: bannedUntil,
    banned_by: user.id,
  });

  if (error) {
    console.error("[sohba] ban insert failed:", error.message);
    return { error: "فشل حظر المستخدم. يرجى المحاولة لاحقاً." };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/bans");
  revalidatePath("/admin/reports");
  revalidatePath("/discover");
  return { success: true };
}

/**
 * Unbans a user by removing their ban record.
 */
export async function unbanUser(userId: string): Promise<AdminActionResult> {
  const userUuid = asUuid(userId);
  if (!userUuid) {
    return { error: "معرّف المستخدم غير صالح." };
  }

  const { supabase } = await requireAdmin();

  const { error } = await supabase
    .from("bans")
    .delete()
    .eq("user_id", userUuid);

  if (error) {
    console.error("[sohba] unban failed:", error.message);
    return { error: "فشل إلغاء الحظر. يرجى المحاولة لاحقاً." };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/bans");
  revalidatePath("/discover");
  return { success: true };
}

/**
 * Fetches all currently banned users.
 */
export async function getBannedUsers(): Promise<BannedUserItem[]> {
  const { supabase } = await requireAdmin();

  const { data: bans, error } = await supabase
    .from("bans")
    .select("*")
    .order("created_at", { ascending: false });

  if (error || !bans) return [];

  const userIds = Array.from(new Set(bans.map((b) => b.user_id)));
  const { data: profiles } = userIds.length
    ? await supabase.from("profiles").select("id, nickname, avatar_url").in("id", userIds)
    : { data: [] };

  const profileMap = new Map((profiles || []).map((p) => [p.id, p]));
  const now = Date.now();

  return bans.map((b) => {
    const prof = profileMap.get(b.user_id);
    const isPermanent = !b.banned_until;
    const isActive = isPermanent || new Date(b.banned_until as string).getTime() > now;
    return {
      id: b.id,
      userId: b.user_id,
      nickname: prof?.nickname || "مستخدم مجهول",
      avatarUrl: prof?.avatar_url || null,
      reason: b.reason,
      bannedUntil: b.banned_until,
      createdAt: b.created_at,
      isPermanent,
      isActive,
    };
  });
}

/**
 * Deletes a message as an administrator.
 */
export async function deleteReportedMessage(
  messageType: "room" | "direct",
  messageId: string
): Promise<AdminActionResult> {
  const messageUuid = asUuid(messageId);
  if (!messageUuid) {
    return { error: "معرّف الرسالة غير صالح." };
  }

  if (messageType !== "room" && messageType !== "direct") {
    return { error: "نوع الرسالة غير صالح." };
  }

  const { supabase } = await requireAdmin();

  const query =
    messageType === "room"
      ? supabase.from("room_messages").delete().eq("id", messageUuid).select("id")
      : supabase.from("messages").delete().eq("id", messageUuid).select("id");

  const { data, error } = await query;

  if (error) {
    console.error("[sohba] admin message delete failed:", error.message);
    return { error: "فشل حذف الرسالة. يرجى المحاولة لاحقاً." };
  }

  if (!data || data.length === 0) {
    return { error: "الرسالة غير موجودة أو تم حذفها مسبقاً." };
  }

  revalidatePath("/admin/reports");
  revalidatePath("/rooms");
  revalidatePath("/messages");
  return { success: true };
}

/**
 * Creates or updates a public chat room.
 */
export async function saveRoom(data: {
  id?: string;
  name: string;
  slug: string;
  description?: string;
  country?: string;
  topic?: string;
  isActive: boolean;
}): Promise<AdminActionResult> {
  const { supabase } = await requireAdmin();

  const name = stripControlCharacters(data.name?.trim() ?? "");
  const slug = (data.slug?.trim() ?? "").toLowerCase();
  const description = stripControlCharacters(data.description?.trim() ?? "");
  const country = stripControlCharacters(data.country?.trim() ?? "");
  const topic = stripControlCharacters(data.topic?.trim() ?? "");

  if (!name || name.length > MAX_ROOM_NAME_LENGTH) {
    return { error: `اسم الغرفة مطلوب (الحد الأقصى ${MAX_ROOM_NAME_LENGTH} حرف).` };
  }

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 80) {
    return {
      error:
        "الرابط التعريفي للغرفة غير صالح: استخدم حروفاً إنجليزية صغيرة وأرقاماً وشرطات فقط.",
    };
  }

  if (description.length > MAX_ROOM_DESCRIPTION_LENGTH) {
    return {
      error: `وصف الغرفة طويل جداً (الحد الأقصى ${MAX_ROOM_DESCRIPTION_LENGTH} حرف).`,
    };
  }

  if (country.length > 60 || topic.length > 60) {
    return { error: "الدولة أو الموضوع طويل جداً." };
  }

  const payload = {
    name,
    slug,
    description: description || null,
    country: country || null,
    topic: topic || null,
    is_active: Boolean(data.isActive),
  };

  if (data.id) {
    // Update
    const roomUuid = asUuid(data.id);
    if (!roomUuid) {
      return { error: "معرّف الغرفة غير صالح." };
    }

    const { error } = await supabase
      .from("rooms")
      .update(payload)
      .eq("id", roomUuid);

    if (error) {
      console.error("[sohba] update room failed:", error.message);
      return { error: "فشل تحديث الغرفة. يرجى المحاولة لاحقاً." };
    }
  } else {
    // Insert
    const { error } = await supabase.from("rooms").insert(payload);

    if (error) {
      console.error("[sohba] create room failed:", error.message);
      return {
        error: toSafeErrorMessage(error, "فشل إنشاء الغرفة. يرجى المحاولة لاحقاً."),
      };
    }
  }

  revalidatePath("/rooms");
  revalidatePath("/admin/rooms");
  return { success: true };
}

/**
 * Toggles room active status.
 */
export async function toggleRoomActive(
  roomId: string,
  isActive: boolean
): Promise<AdminActionResult> {
  const roomUuid = asUuid(roomId);
  if (!roomUuid) {
    return { error: "معرّف الغرفة غير صالح." };
  }

  const { supabase } = await requireAdmin();

  const { error } = await supabase
    .from("rooms")
    .update({ is_active: Boolean(isActive) })
    .eq("id", roomUuid);

  if (error) {
    console.error("[sohba] toggle room failed:", error.message);
    return { error: "فشل تعديل حالة الغرفة. يرجى المحاولة لاحقاً." };
  }

  revalidatePath("/rooms");
  revalidatePath("/admin/rooms");
  return { success: true };
}
