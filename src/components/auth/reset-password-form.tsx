"use client";

import { useActionState } from "react";
import Link from "next/link";
import { updatePassword, type AuthState } from "@/lib/actions/auth";
import { Alert } from "@/components/ui/alert";
import { Button, buttonClassName } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { inputClassName } from "@/components/ui/form-control";

export function ResetPasswordForm() {
  const [state, formAction, isPending] = useActionState<AuthState | null, FormData>(
    updatePassword,
    null
  );

  return (
    <form action={formAction} className="space-y-4">
      {state?.error && <Alert tone="error">{state.error}</Alert>}

      {state?.success && (
        <div className="space-y-3">
          <Alert tone="success">{state.success}</Alert>
          <Link
            href="/login"
            className={buttonClassName({ size: "lg", fullWidth: true })}
          >
            الانتقال لتسجيل الدخول
          </Link>
        </div>
      )}

      {!state?.success && (
        <>
          <Field label="كلمة المرور الجديدة" htmlFor="password">
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

          <Field label="تأكيد كلمة المرور الجديدة" htmlFor="confirmPassword">
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

          <div className="pt-2">
            <Button type="submit" size="lg" fullWidth disabled={isPending}>
              {isPending ? "جاري التحديث..." : "حفظ كلمة المرور"}
            </Button>
          </div>
        </>
      )}
    </form>
  );
}
