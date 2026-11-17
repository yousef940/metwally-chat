"use client";

import { useActionState, useState } from "react";
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
    <form id="profile-edit-form" action={formAction} className="space-y-6">
      {/* Top Card Header with Always-Visible Save Button */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.10] pb-4">
        <div>
          <h2 className="text-lg font-bold text-white">تعديل بيانات الملف الشخصي</h2>
          <p className="mt-0.5 text-xs text-white/55">
            عدّل صورتك ومعلوماتك واضغط حفظ في أي وقت
          </p>
        </div>
        <Button type="submit" size="md" disabled={isPending}>
          {isPending ? "جاري الحفظ..." : "حفظ التعديلات"}
        </Button>
      </div>

      {state?.error && <Alert tone="error">{state.error}</Alert>}
      {state?.success && <Alert tone="success">{state.success}</Alert>}

      {/* Hidden inputs carrying the client side state */}
      <input type="hidden" name="avatar_url" value={avatarUrl || ""} />
      <input type="hidden" name="interests" value={JSON.stringify(interests)} />

      {/* Avatar Section */}
      <div className="rounded-[22px] border border-white/[0.10] bg-white/[0.04] p-4">
        <p className="mb-3 block text-sm font-semibold text-white">
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
      <Field
        label="سنة الميلاد (السن)"
        htmlFor="birthYear"
        hint="تُحسب سنك تلقائياً وتظهر في بروفايلك."
      >
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
          className="mb-2.5 block text-sm font-semibold text-white"
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
                className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0A84FF] ${
                  isSelected
                    ? "ios-btn-primary text-white"
                    : "ios-btn-glass text-white/80 hover:text-white"
                }`}
              >
                {isSelected ? `✓ ${item}` : `+ ${item}`}
              </button>
            );
          })}
        </div>
      </div>

      {/* Sticky Floating Liquid Glass Save Bar — Always Visible While Scrolling */}
      <div className="sticky bottom-24 md:bottom-5 z-30 pt-2">
        <div className="ios-glass-strong flex items-center justify-between gap-3 rounded-full px-4 py-2.5">
          <span className="text-xs font-medium text-white/75 truncate ps-1">
            {isPending
              ? "جاري حفظ التعديلات..."
              : state?.success
              ? "✓ تم حفظ تعديلاتك بنجاح"
              : "اضغط لحفظ تعديلات ملفك الشخصي"}
          </span>
          <Button type="submit" size="md" disabled={isPending} className="shrink-0">
            {isPending ? "جاري الحفظ..." : "حفظ التعديلات"}
          </Button>
        </div>
      </div>
    </form>
  );
}
