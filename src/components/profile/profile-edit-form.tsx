"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { updateProfile, type ProfileActionState } from "@/lib/actions/profile";
import { AvatarUpload } from "@/components/profile/avatar-upload";
import { GenderBadge } from "@/components/profile/gender-badge";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import {
  inputClassName,
  selectClassName,
  textareaClassName,
} from "@/components/ui/form-control";
import { ARAB_COUNTRIES, getCountryFlag } from "@/lib/constants";
import type { Profile } from "@/lib/profile";

const SUGGESTED_INTERESTS = [
  "القراءة والكتب",
  "السفر والاستكشاف",
  "الرياضة واللياقة",
  "الطهي والمأكولات",
  "التكنولوجيا والبرمجة",
  "الفنون والتصميم",
  "الموسيقى والشعر",
  "السينما والأفلام",
  "ريادة الأعمال",
  "التصوير الفوتوغرافي",
  "الطبيعة والتخييم",
  "التاريخ والثقافة",
];

const MAX_INTERESTS = 8;

export function ProfileEditForm({
  userId,
  profile,
}: {
  userId: string;
  profile: Profile;
}) {
  const [state, formAction, isPending] = useActionState<
    ProfileActionState | null,
    FormData
  >(updateProfile, null);

  const [avatarUrl, setAvatarUrl] = useState<string | null>(
    profile.avatar_url || null
  );
  const [selectedGender, setSelectedGender] = useState<string>(
    profile.gender || "male"
  );
  const [interests, setInterests] = useState<string[]>(
    profile.interests || []
  );

  const toggleInterest = (interest: string) => {
    setInterests((current) => {
      if (current.includes(interest)) {
        return current.filter((item) => item !== interest);
      }
      if (current.length >= MAX_INTERESTS) return current;
      return [...current, interest];
    });
  };

  return (
    <form action={formAction} className="space-y-6">
      {state?.error && <Alert tone="error">{state.error}</Alert>}

      {state?.success && <Alert tone="success">{state.success}</Alert>}

      {/* Hidden inputs carrying the client side state */}
      <input type="hidden" name="avatar_url" value={avatarUrl || ""} />
      <input type="hidden" name="interests" value={JSON.stringify(interests)} />

      {/* Avatar Section */}
      <div className="rounded-xl border border-ink/10 bg-ink/[0.02] p-4">
        <p className="mb-3 block text-sm font-semibold text-ink">
          الصورة الشخصية
        </p>
        <AvatarUpload
          userId={userId}
          initialUrl={profile.avatar_url}
          onUploadComplete={(url) => setAvatarUrl(url)}
        />
      </div>

      {/* Nickname & Gender */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="الاسم المستعار" htmlFor="nickname" required>
          <input
            id="nickname"
            name="nickname"
            type="text"
            required
            defaultValue={profile.nickname}
            minLength={2}
            maxLength={30}
            className={inputClassName}
          />
        </Field>

        <Field
          label="الجنس والنوع"
          htmlFor="gender"
          required
          labelAction={<GenderBadge gender={selectedGender} />}
        >
          <select
            id="gender"
            name="gender"
            value={selectedGender}
            onChange={(e) => setSelectedGender(e.target.value)}
            required
            className={selectClassName}
          >
            <option value="male">ذكر (شاب)</option>
            <option value="female">أنثى (شابة)</option>
          </select>
        </Field>
      </div>

      {/* Birth Year Selector */}
      <Field label="سنة الميلاد (السن)" htmlFor="birthYear" hint="تُحسب سنك تلقائياً وتظهر في بروفايلك.">
        <select
          id="birthYear"
          name="birthYear"
          defaultValue={new Date().getFullYear() - (profile.age || 20)}
          className={selectClassName}
        >
          {Array.from({ length: 65 }, (_, i) => new Date().getFullYear() - i).map((year) => (
            <option key={year} value={year}>
              {year} (السن: {new Date().getFullYear() - year} سنة)
            </option>
          ))}
        </select>
      </Field>

      {/* Country & City */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="الدولة" htmlFor="country" required>
          <select
            id="country"
            name="country"
            required
            defaultValue={profile.country || "مصر"}
            className={selectClassName}
          >
            {ARAB_COUNTRIES.map((country) => (
              <option key={country} value={country}>
                {getCountryFlag(country)} {country}
              </option>
            ))}
          </select>
        </Field>

        <Field label="المدينة" htmlFor="city" required>
          <input
            id="city"
            name="city"
            type="text"
            required
            defaultValue={profile.city || ""}
            placeholder="مثال: القاهرة"
            className={inputClassName}
          />
        </Field>
      </div>

      <input type="hidden" name="intent" value={profile.intent || "both"} />

      {/* Short Bio */}
      <Field
        label="نبذة تعريفية (Bio)"
        htmlFor="bio"
        hint="بحد أقصى 500 حرف."
      >
        <textarea
          id="bio"
          name="bio"
          rows={3}
          maxLength={500}
          defaultValue={profile.bio || ""}
          placeholder="اكتب بضع كلمات عن شخصيتك، أفكارك، واهتماماتك..."
          className={textareaClassName}
        />
      </Field>

      {/* Interests Chips */}
      <div>
        <p
          id="interests-label"
          className="mb-2 block text-sm font-semibold text-ink"
        >
          الاهتمامات والهوايات (اختر حتى 8)
        </p>
        <div
          role="group"
          aria-labelledby="interests-label"
          className="flex flex-wrap gap-2"
        >
          {SUGGESTED_INTERESTS.map((item) => {
            const isSelected = interests.includes(item);
            return (
              <button
                key={item}
                type="button"
                onClick={() => toggleInterest(item)}
                aria-pressed={isSelected}
                className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral ${
                  isSelected
                    ? "bg-coral text-white shadow-sm"
                    : "border border-ink/20 bg-white text-ink/80 hover:bg-ink/5"
                }`}
              >
                {isSelected ? `✓ ${item}` : `+ ${item}`}
              </button>
            );
          })}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center gap-3 pt-4">
        <Button type="submit" size="lg" disabled={isPending}>
          {isPending ? "جاري الحفظ..." : "حفظ التعديلات"}
        </Button>
        <Link
          href="/profile"
          className="inline-flex items-center justify-center rounded-xl border border-ink/20 bg-white px-6 py-3 text-base font-semibold text-ink transition-colors hover:bg-ink/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
        >
          معاينة الملف الشخصي
        </Link>
      </div>
    </form>
  );
}
