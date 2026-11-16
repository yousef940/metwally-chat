"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import {
  GENDER_VALUES,
  INTENT_VALUES,
  normalizeInterests,
  sanitizeAvatarUrl,
  stripControlCharacters,
  toSafeErrorMessage,
  type GenderValue,
  type IntentValue,
} from "@/lib/validation";

export interface ProfileActionState {
  error?: string | null;
  success?: string | null;
}

/** Maximum length of the "about me" field. */
const MAX_BIO_LENGTH = 500;

export async function updateProfile(
  _prevState: ProfileActionState | null,
  formData: FormData
): Promise<ProfileActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "يجب تسجيل الدخول لتحديث الملف الشخصي." };
  }

  const nickname = stripControlCharacters(
    (formData.get("nickname") as string)?.trim() ?? ""
  );
  const bioRaw = (formData.get("bio") as string)?.trim() ?? "";
  const genderRaw = (formData.get("gender") as string | null)?.trim();
  const intentRaw = (formData.get("intent") as string | null)?.trim();
  const country = (formData.get("country") as string)?.trim();
  const city = (formData.get("city") as string)?.trim();
  const interestsRaw = formData.get("interests");
  const avatarUrlRaw = formData.get("avatar_url") as string | null;

  if (!nickname || nickname.length < 2 || nickname.length > 30) {
    return { error: "الاسم المستعار مطلوب ويجب أن يتراوح بين حرفين و30 حرفاً." };
  }

  if (bioRaw.length > MAX_BIO_LENGTH) {
    return { error: "النبذة قصيرة جداً — الحد الأقصى 500 حرف." };
  }

  if (!country || country.length < 2 || country.length > 60) {
    return { error: "يرجى اختيار دولة صحيحة." };
  }

  if (!city || city.length < 2 || city.length > 60) {
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

  const interests = normalizeInterests(interestsRaw);

  const updateData: Record<string, unknown> = {
    nickname,
    bio: bioRaw ? stripControlCharacters(bioRaw) : null,
    gender: gender || null,
    intent,
    country,
    city,
    interests,
    updated_at: new Date().toISOString(),
  };

  const birthYearRaw = (formData.get("birthYear") as string)?.trim();
  if (birthYearRaw) {
    const year = parseInt(birthYearRaw, 10);
    const currentYear = new Date().getFullYear();
    if (!isNaN(year) && year >= 1940 && year <= currentYear) {
      const calculatedAge = currentYear - year;
      updateData.age = calculatedAge;

      await supabase.from("profile_private").upsert({
        user_id: user.id,
        birth_date: `${year}-01-01`,
      });
    }
  }

  if (avatarUrlRaw && avatarUrlRaw.trim()) {
    const avatarUrl = sanitizeAvatarUrl(avatarUrlRaw);
    if (!avatarUrl) {
      return { error: "رابط الصورة الشخصية غير صالح." };
    }
    updateData.avatar_url = avatarUrl;
  }

  const { error } = await supabase
    .from("profiles")
    .update(updateData)
    .eq("id", user.id);

  if (error) {
    return {
      error: toSafeErrorMessage(
        error,
        "حدث خطأ أثناء حفظ البيانات. يرجى المحاولة لاحقاً."
      ),
    };
  }

  revalidatePath("/profile");
  revalidatePath("/settings");
  revalidatePath("/");

  return { success: "تم تحديث الملف الشخصي بنجاح!" };
}
