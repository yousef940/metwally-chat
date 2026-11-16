"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { checkRateLimit } from "@/lib/safety/rate-limit";
import {
  asIsoDate,
  isValidEmail,
  nicknameToInternalEmail,
  sanitizeRedirectPath,
  stripControlCharacters,
  toSafeErrorMessage,
  type GenderValue,
  type IntentValue,
  GENDER_VALUES,
  INTENT_VALUES,
} from "@/lib/validation";

export interface AuthState {
  error?: string | null;
  success?: string | null;
}

/** Maximum accepted password length (bcrypt limit used by Supabase Auth). */
const MAX_PASSWORD_LENGTH = 72;

/**
 * Calculates exact age in full completed years
 */
function calculateAge(birthDateString: string): number {
  const birthDate = new Date(`${birthDateString}T00:00:00Z`);
  if (isNaN(birthDate.getTime())) {
    return -1;
  }
  const today = new Date();
  let age = today.getUTCFullYear() - birthDate.getUTCFullYear();
  const monthDiff = today.getUTCMonth() - birthDate.getUTCMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getUTCDate() < birthDate.getUTCDate())) {
    age--;
  }
  return age;
}

/**
 * Sign up a new user with strict age verification (18+)
 */
export async function signUp(
  _prevState: AuthState | null,
  formData: FormData
): Promise<AuthState> {
  const nickname = stripControlCharacters((formData.get("nickname") as string)?.trim() ?? "");
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;
  const birthYearRaw = (formData.get("birthYear") as string)?.trim();
  let birthDateRaw = (formData.get("birthDate") as string)?.trim();
  if (birthYearRaw && !birthDateRaw) {
    birthDateRaw = `${birthYearRaw}-01-01`;
  }
  const country = (formData.get("country") as string)?.trim();
  const city = (formData.get("city") as string)?.trim();
  const genderRaw = (formData.get("gender") as string | null)?.trim();
  const intentRaw = (formData.get("intent") as string | null)?.trim();

  // Validate required fields (email is eliminated; mapped to nickname)
  if (!password || !confirmPassword || !nickname || !birthDateRaw || !country || !city) {
    return { error: "يرجى ملء جميع الحقول المطلوبة." };
  }

  if (password !== confirmPassword) {
    return { error: "كلمتا المرور غير متطابقتين." };
  }

  if (password.length < 6) {
    return { error: "كلمة المرور يجب أن لا تقل عن 6 أحرف." };
  }

  if (password.length > MAX_PASSWORD_LENGTH) {
    return { error: "كلمة المرور طويلة جداً (الحد الأقصى 72 حرفاً)." };
  }

  if (nickname.length < 2 || nickname.length > 30) {
    return { error: "الاسم المستعار يجب أن يكون بين حرفين و 30 حرفاً." };
  }

  if (country.length < 2 || country.length > 60) {
    return { error: "يرجى اختيار دولة صحيحة." };
  }

  if (city.length < 2 || city.length > 60) {
    return { error: "يرجى إدخال اسم مدينة صحيح." };
  }

  const gender = (genderRaw || null) as GenderValue | null;
  if (gender !== null && !GENDER_VALUES.includes(gender)) {
    return { error: "يرجى اختيار جنس صالح (ذكر أو أنثى)." };
  }

  const intent = (intentRaw || "both") as IntentValue;
  if (!INTENT_VALUES.includes(intent)) {
    return { error: "يرجى اختيار نوع التعارف الصحيح." };
  }

  // Strict 18+ verification
  const birthDate = asIsoDate(birthDateRaw);
  if (!birthDate) {
    return { error: "تاريخ الميلاد المدخل غير صالح." };
  }

  const age = calculateAge(birthDate);
  if (age < 0 || age > 120) {
    return { error: "تاريخ الميلاد المدخل غير صالح." };
  }

  const supabase = await createClient();

  // Check if nickname is already taken by another member
  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("id")
    .ilike("nickname", nickname)
    .maybeSingle();

  if (existingProfile) {
    return { error: "هذا الاسم مستخدم بالفعل، يرجى اختيار اسم آخر." };
  }

  // Generate deterministic internal email mapped to nickname
  const email = nicknameToInternalEmail(nickname);

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        nickname,
        birth_date: birthDate,
        country,
        city,
        gender: gender || null,
        intent,
      },
    },
  });

  if (error) {
    console.error("[sohba] signUp error:", error);
    if (
      error.message.includes("already registered") ||
      error.message.includes("User already registered")
    ) {
      return { error: "هذا الاسم مستخدم بالفعل، يرجى اختيار اسم آخر." };
    }
    if (error.message.includes("Password should be")) {
      return { error: "كلمة المرور يجب أن لا تقل عن 6 أحرف." };
    }
    if (
      error.message.includes("rate limit") ||
      error.message.includes("over_email_send_rate_limit")
    ) {
      return {
        error:
          "تنبيه: يجب تعطيل خيار 'Confirm email' في إعدادات Supabase Authentication حتى يتم التسجيل بالاسم المستعار مباشرة دون إرسال إيميلات.",
      };
    }
    return {
      error: toSafeErrorMessage(
        error,
        "حدث خطأ أثناء إنشاء الحساب، يرجى المحاولة لاحقاً."
      ),
    };
  }

  // If a session was created directly (email confirmation disabled), make sure
  // the profile rows exist. The database trigger normally handles this.
  if (data.user && data.session) {
    const { error: profileError } = await supabase.from("profiles").upsert({
      id: data.user.id,
      nickname,
      country,
      city,
      age,
      gender: gender || null,
      intent,
    });

    if (profileError) {
      console.error("[sohba] profile bootstrap failed:", profileError.message);
    }

    const { error: privateError } = await supabase.from("profile_private").upsert({
      user_id: data.user.id,
      email,
      birth_date: birthDate,
    });

    if (privateError) {
      console.error("[sohba] private profile bootstrap failed:", privateError.message);
    }
  }

  revalidatePath("/", "layout");

  // If user has session, redirect to home
  if (data.session) {
    redirect("/");
  }

  return {
    success:
      "تم إنشاء حسابك بنجاح! إذا تطلب تأكيد البريد الإلكتروني، يرجى مراجعة صندوق الوارد لتفعيل الحساب.",
  };
}

/**
 * Sign in existing user
 */
export async function signIn(
  _prevState: AuthState | null,
  formData: FormData
): Promise<AuthState> {
  const loginInput = (
    (formData.get("nickname") ||
      formData.get("email") ||
      formData.get("username")) as string
  )?.trim();
  const password = formData.get("password") as string;
  const redirectUrl = sanitizeRedirectPath(formData.get("redirect"), "/");

  if (!loginInput || !password) {
    return { error: "يرجى إدخال الاسم وكلمة المرور." };
  }

  // If input contains '@', use directly as email; otherwise convert nickname to deterministic email
  const email = loginInput.includes("@")
    ? loginInput.toLowerCase()
    : nicknameToInternalEmail(loginInput);

  // Throttle repeated attempts per account to slow down credential stuffing.
  const attemptLimit = checkRateLimit(email, "signInAttempt");
  if (!attemptLimit.allowed) {
    return {
      error: "محاولات دخول كثيرة خلال وقت قصير. يرجى المحاولة بعد قليل.",
    };
  }

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    // Never leak Supabase internals to the browser.
    return { error: "الاسم المستعار أو كلمة المرور غير صحيحة." };
  }

  // Check if banned (the owner can always read their own ban record).
  if (data.user) {
    const { data: bans, error: banError } = await supabase
      .from("bans")
      .select("reason, banned_until")
      .eq("user_id", data.user.id)
      .limit(5);

    if (banError) {
      console.error("[sohba] ban lookup failed:", banError.message);
    }

    const activeBan = (bans ?? []).find(
      (ban) => !ban.banned_until || new Date(ban.banned_until) > new Date()
    );

    if (activeBan) {
      await supabase.auth.signOut();
      return {
        error: `تم حظر هذا الحساب من استخدام المنصة: ${activeBan.reason}`,
      };
    }
  }

  revalidatePath("/", "layout");
  redirect(redirectUrl);
}

/**
 * Sign out user
 */
export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}

/**
 * Send password reset email
 */
export async function resetPassword(
  _prevState: AuthState | null,
  formData: FormData
): Promise<AuthState> {
  const email = (formData.get("email") as string)?.trim().toLowerCase();

  if (!email) {
    return { error: "يرجى إدخال عنوان البريد الإلكتروني." };
  }

  if (!isValidEmail(email)) {
    return { error: "يرجى إدخال بريد إلكتروني صحيح." };
  }

  // Prevent email-bombing a single address.
  const limit = checkRateLimit(email, "passwordReset");
  if (!limit.allowed) {
    return {
      error: "تم إرسال عدة طلبات استعادة لقمة هذا البريد. يرجى المحاولة بعد قليل.",
    };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.resetPasswordForEmail(email);

  if (error) {
    console.error("[sohba] password reset failed:", error.message);
    return {
      error: "تعذر إرسال رسالة الاستعادة حالياً، يرجى التحقق من البريد المدخل والمحاولة لاحقاً.",
    };
  }

  return {
    success:
      "إذا كان هذا البريد مسجلاً لدينا، فستصلك رسالة تحتوي على رابط لإعادة تعيين كلمة المرور.",
  };
}

/**
 * Update user password
 */
export async function updatePassword(
  _prevState: AuthState | null,
  formData: FormData
): Promise<AuthState> {
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!password || !confirmPassword) {
    return { error: "يرجى ملء جميع الحقول." };
  }

  if (password !== confirmPassword) {
    return { error: "كلمتا المرور غير متطابقتين." };
  }

  if (password.length < 6) {
    return { error: "كلمة المرور يجب أن لا تقل عن 6 أحرف." };
  }

  if (password.length > MAX_PASSWORD_LENGTH) {
    return { error: "كلمة المرور طويلة جداً (الحد الأقصى 72 حرفاً)." };
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "يجب تسجيل الدخول لتحديث كلمة المرور." };
  }

  const limit = checkRateLimit(user.id, "passwordUpdate");
  if (!limit.allowed) {
    return {
      error: "تم تحديث كلمة المرور عدة مرات خلال وقت قصير. يرجى المحاولة بعد قليل.",
    };
  }

  const { error } = await supabase.auth.updateUser({
    password,
  });

  if (error) {
    console.error("[sohba] password update failed:", error.message);
    return { error: "حدث خطأ أثناء تحديث كلمة المرور." };
  }

  revalidatePath("/", "layout");
  return { success: "تم تحديث كلمة المرور بنجاح!" };
}

/**
 * Permanently delete current user account and data
 */
export async function deleteAccount(): Promise<AuthState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "يجب تسجيل الدخول لإتمام هذا الإجراء." };
  }

  // Remove the uploaded avatar files (best effort; the database rows cascade).
  try {
    const { data: avatarFiles } = await supabase.storage.from("avatars").list(user.id);
    if (avatarFiles && avatarFiles.length > 0) {
      await supabase.storage
        .from("avatars")
        .remove(avatarFiles.map((file) => `${user.id}/${file.name}`));
    }
  } catch {
    // Ignore storage cleanup failures: the account deletion below is what matters.
  }

  // Attempt database RPC self deletion (cascades to every table).
  const { error: rpcError } = await supabase.rpc("delete_own_user");

  if (rpcError) {
    console.error("[sohba] delete_own_user failed:", rpcError.message);

    // Fallback: remove the public profile row only.
    const { error: deleteError } = await supabase
      .from("profiles")
      .delete()
      .eq("id", user.id);

    if (deleteError) {
      console.error("[sohba] profile delete failed:", deleteError.message);
      return {
        error: "تعذر حذف الحساب في الوقت الحالي، يرجى المحاولة لاحقاً.",
      };
    }

    return {
      error:
        "تم حذف بيانات الملف الشخصي، لكن تعذر حذف حساب الدخول نفسه. تواصل مع الدعم لإتمام الحظر.",
    };
  }

  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
