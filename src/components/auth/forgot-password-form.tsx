"use client";

import { useActionState } from "react";
import Link from "next/link";
import { resetPassword, type AuthState } from "@/lib/actions/auth";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { inputClassName } from "@/components/ui/form-control";

export function ForgotPasswordForm() {
  const [state, formAction, isPending] = useActionState<AuthState | null, FormData>(
    resetPassword,
    null
  );

  return (
    <form action={formAction} className="space-y-4">
      {state?.error && <Alert tone="error">{state.error}</Alert>}

      {state?.success && <Alert tone="success">{state.success}</Alert>}

      <Field
        label="البريد الإلكتروني المسجل"
        htmlFor="email"
        hint="سنرسل لك رابطاً آمناً لإعادة تعيين كلمة المرور الخاصة بك."
      >
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="name@example.com"
          className={inputClassName}
        />
      </Field>

      <div className="pt-2">
        <Button type="submit" size="lg" fullWidth disabled={isPending}>
          {isPending ? "جاري الإرسال..." : "إرسال رابط الاستعادة"}
        </Button>
      </div>

      <div className="pt-2 text-center">
        <Link
          href="/login"
          className="text-sm font-semibold text-coral hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral"
        >
          العودة لتسجيل الدخول
        </Link>
      </div>
    </form>
  );
}
