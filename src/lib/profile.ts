import { cache } from "react";
import { createClient, type SupabaseServerClient } from "@/lib/supabase/server";
import { asIsoDate, GENDER_VALUES, INTENT_VALUES } from "@/lib/validation";

export interface Profile {
  id: string;
  nickname: string;
  avatar_url: string | null;
  bio: string | null;
  gender: "male" | "female" | null;
  intent: "friendship" | "serious" | "both";
  country: string;
  city: string;
  age: number;
  interests?: string[] | null;
  role?: string | null;
  created_at: string;
  updated_at: string;
}

/** Minimum age allowed by the platform. */
const MINIMUM_AGE = 1;
/** Maximum age allowed by the platform. */
const MAXIMUM_AGE = 120;

/**
 * Calculates completed age in years
 */
export function calculateAgeFromBirthDate(birthDateStr?: string | null): number {
  if (!birthDateStr) return MINIMUM_AGE;
  const birth = new Date(`${birthDateStr}T00:00:00Z`);
  if (isNaN(birth.getTime())) return MINIMUM_AGE;
  const today = new Date();
  let age = today.getUTCFullYear() - birth.getUTCFullYear();
  const m = today.getUTCMonth() - birth.getUTCMonth();
  if (m < 0 || (m === 0 && today.getUTCDate() < birth.getUTCDate())) {
    age--;
  }
  return Math.max(MINIMUM_AGE, Math.min(MAXIMUM_AGE, age));
}

/**
 * Returns the active ban of a user, if any.
 * The database policy allows a user to read their own ban record, so this
 * works for regular members (not only administrators).
 */
export async function getActiveBan(
  supabase: SupabaseServerClient,
  userId: string
): Promise<{ banned: boolean; reason: string | null; bannedUntil: string | null }> {
  const { data, error } = await supabase
    .from("bans")
    .select("reason, banned_until")
    .eq("user_id", userId)
    .limit(10);

  if (error) {
    console.error("[sohba] ban lookup failed:", error.message);
    return { banned: false, reason: null, bannedUntil: null };
  }

  const now = Date.now();
  const active = (data ?? []).find((ban) => {
    if (!ban.banned_until) return true; // permanent ban
    return new Date(ban.banned_until).getTime() > now;
  });

  if (!active) {
    return { banned: false, reason: null, bannedUntil: null };
  }

  return {
    banned: true,
    reason: active.reason ?? null,
    bannedUntil: active.banned_until ?? null,
  };
}

/**
 * Retrieves the current logged in user and their profile.
 * If profile is not yet in the DB (e.g. signup before trigger was applied),
 * it automatically recovers the data from user_metadata.
 */
export const getCurrentUserProfile = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { user: null, profile: null, supabase };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (profile) {
    return { user, profile: profile as Profile, supabase };
  }

  // Auto-heal profile from metadata (only for a logged-in owner).
  const meta = user.user_metadata || {};

  const rawNickname = (meta.nickname as string)?.trim() ?? "";
  const emailFallback = (user.email?.split("@")[0] ?? "مستخدم").slice(0, 30);
  const nickname =
    rawNickname.length >= 2 && rawNickname.length <= 30 ? rawNickname : emailFallback;

  const rawCountry = (meta.country as string)?.trim() ?? "";
  const country = rawCountry.length >= 2 && rawCountry.length <= 60 ? rawCountry : "مصر";

  const rawCity = (meta.city as string)?.trim() ?? "";
  const city = rawCity.length >= 2 && rawCity.length <= 60 ? rawCity : "القاهرة";

  const rawGender = (meta.gender as string) ?? "";
  const gender = GENDER_VALUES.includes(rawGender as (typeof GENDER_VALUES)[number])
    ? (rawGender as "male" | "female")
    : null;

  const rawIntent = (meta.intent as string) ?? "";
  const intent = INTENT_VALUES.includes(rawIntent as (typeof INTENT_VALUES)[number])
    ? (rawIntent as "friendship" | "serious" | "both")
    : "both";

  // Only a real, valid birth date is stored — never a fabricated one.
  const birthDate = asIsoDate((meta.birth_date as string) ?? null);
  const age = calculateAgeFromBirthDate(birthDate);

  const { data: createdProfile, error: createError } = await supabase
    .from("profiles")
    .upsert({
      id: user.id,
      nickname,
      country,
      city,
      gender,
      intent,
      age,
    })
    .select()
    .single();

  if (createError) {
    console.warn("[sohba] profile auto-heal warning:", createError.message);
  }

  if (birthDate) {
    const { error: privateError } = await supabase.from("profile_private").upsert({
      user_id: user.id,
      email: user.email ?? null,
      birth_date: birthDate,
    });

    if (privateError) {
      console.warn("[sohba] private profile auto-heal warning:", privateError.message);
    }
  }

  return {
    user,
    profile: (createdProfile || {
      id: user.id,
      nickname,
      avatar_url: null,
      bio: null,
      gender,
      intent,
      country,
      city,
      age,
      interests: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }) as Profile,
    supabase,
  };
});
