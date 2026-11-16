import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * Routes that require an authenticated session.
 */
const PROTECTED_PREFIXES = [
  "/rooms",
  "/messages",
  "/discover",
  "/profile",
  "/settings",
  "/admin",
];

/**
 * Routes that a signed-in user must not see (they are redirected home).
 */
const AUTH_PATHS = ["/login", "/register", "/forgot-password"];

/**
 * Keeps only a safe same-site path. Blocks absolute URLs and protocol
 * relative paths (`//evil.com`) that could be used for an open redirect.
 */
function safeRedirectTarget(value: string): string {
  if (!value.startsWith("/")) return "/";
  if (value.startsWith("//") || value.startsWith("/\\")) return "/";
  if (/[\r\n\t]/.test(value)) return "/";
  if (/^\/+[a-z][a-z0-9+.-]*:/i.test(value)) return "/";
  return value;
}

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return supabaseResponse;
  }

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  // `getUser()` revalidates the token with Supabase Auth, so an expired or
  // forged cookie cannot be used to reach a protected route.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  const isProtectedPath = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  const isAuthPath = AUTH_PATHS.some((path) => pathname === path);

  if (isProtectedPath && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    // Keep the original path (and query) so the user returns where they were.
    url.search = "";
    url.searchParams.set(
      "redirect",
      safeRedirectTarget(`${pathname}${request.nextUrl.search}`)
    );
    return NextResponse.redirect(url);
  }

  if (isAuthPath && user) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (svg, png, jpg, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
