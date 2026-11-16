"use client";

import { useActionState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { signIn, type AuthState } from "@/lib/actions/auth";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { inputClassName } from "@/components/ui/form-control";

export function LoginForm() {
  const [state, formAction, isPending] = useActionState<AuthState | null, FormData>(
    signIn,
    null
  );

  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || "/rooms";

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="redirect" value={redirectUrl} />

      {state?.error && <Alert tone="error">{state.error}</Alert>}

      <Field label="الاسم المستعار (اسم المستخدم)" htmlFor="nickname">
        <input
          id="nickname"
          name="nickname"
          type="text"
          required
          autoComplete="username"
          placeholder="اكتب اسمك المستعار"
          className={inputClassName}
        />
      </Field>

      <Field
        label="كلمة المرور"
        htmlFor="password"
        labelAction={
          <Link
            href="/forgot-password"
            className="text-xs font-semibold text-coral hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral"
          >
            نسيت كلمة المرور؟
          </Link>
        }
      >
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          placeholder="••••••••"
          className={inputClassName}
        />
      </Field>

      <div className="pt-2">
        <Button type="submit" size="lg" fullWidth disabled={isPending}>
          {isPending ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
        </Button>
      </div>

      <div className="pt-2 text-center">
        <p className="text-sm text-ink/70">
          ليس لديك حساب بعد؟{" "}
          <Link
            href="/register"
            className="font-semibold text-coral hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral"
          >
            إنشاء حساب جديد
          </Link>
        </p>
      </div>
    </form>
  );
}
