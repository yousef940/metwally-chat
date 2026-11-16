"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signUp, type AuthState } from "@/lib/actions/auth";
import { ARAB_COUNTRIES, getCountryFlag } from "@/lib/constants";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import {
  inputClassName,
  selectClassName,
} from "@/components/ui/form-control";

export function RegisterForm() {
  const [state, formAction, isPending] = useActionState<AuthState | null, FormData>(
    signUp,
    null
  );

  const currentYear = new Date().getFullYear();
  // Generate birth years from current year down to 70 years ago
  const years = Array.from({ length: 65 }, (_, i) => currentYear - i);

  return (
    <form action={formAction} className="space-y-4">
      {state?.error && <Alert tone="error">{state.error}</Alert>}
      {state?.success && <Alert tone="success">{state.success}</Alert>}

      <input type="hidden" name="acceptTerms" value="true" />
      <input type="hidden" name="intent" value="both" />

      <Field
        label="الاسم المستعار (اسم المستخدم)"
        htmlFor="nickname"
        required
        hint="هذا الاسم ستسجل الدخول به وسيظهر للجميع في الشات."
      >
        <input
          id="nickname"
          name="nickname"
          type="text"
          required
          minLength={2}
          maxLength={30}
          placeholder="مثال: يوسف / أحمد / سارة"
          className={inputClassName}
        />
      </Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field
          label="سنة الميلاد (السن)"
          htmlFor="birthYear"
          required
          hint="لحساب عمرك تلقائياً في حسابك."
        >
          <select
            id="birthYear"
            name="birthYear"
            required
            defaultValue="2004"
            className={selectClassName}
          >
            {years.map((year) => {
              const age = currentYear - year;
              return (
                <option key={year} value={year}>
                  {year} (السن: {age} سنة)
                </option>
              );
            })}
          </select>
        </Field>

        <Field label="الجنس" htmlFor="gender">
          <select
            id="gender"
            name="gender"
            defaultValue=""
            className={selectClassName}
          >
            <option value="">غير محدد</option>
            <option value="male">👨 ذكر</option>
            <option value="female">👩 أنثى</option>
          </select>
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="الدولة" htmlFor="country" required>
          <select
            id="country"
            name="country"
            required
            defaultValue="مصر"
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
            placeholder="مثال: القاهرة / الإسكندرية / الرياض"
            className={inputClassName}
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="كلمة المرور" htmlFor="password" required>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={6}
            placeholder="••••••••"
            className={inputClassName}
          />
        </Field>

        <Field label="تأكيد كلمة المرور" htmlFor="confirmPassword" required>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            required
            minLength={6}
            placeholder="••••••••"
            className={inputClassName}
          />
        </Field>
      </div>

      <div className="pt-3">
        <Button type="submit" size="lg" fullWidth disabled={isPending}>
          {isPending ? "جاري إنشاء الحساب..." : "إنشاء حساب جديد"}
        </Button>
      </div>

      <div className="pt-2 text-center">
        <p className="text-sm text-[#9CB3B8]">
          لديك حساب بالفعل؟{" "}
          <Link
            href="/login"
            className="font-semibold text-coral hover:underline focus-visible:outline-2 focus-visible:outline-coral"
          >
            تسجيل الدخول
          </Link>
        </p>
      </div>
    </form>
  );
}
