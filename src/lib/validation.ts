/**
 * Shared server-side validation helpers.
 *
 * Every Server Action must validate its input here (or with an equivalent
 * explicit check) before touching the database. The browser is never trusted.
 */

/** Generic UUID shape (accepts any version, not only v4). */
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Very small, intentionally permissive email shape check. */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** ISO date (YYYY-MM-DD) with a real calendar day. */
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export const GENDER_VALUES = ["male", "female"] as const;
export type GenderValue = (typeof GENDER_VALUES)[number];

export const INTENT_VALUES = ["friendship", "serious", "both"] as const;
export type IntentValue = (typeof INTENT_VALUES)[number];

export function isValidUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value.trim());
}

/**
 * Returns the trimmed value when it is a valid UUID, otherwise null.
 * Use this before interpolating an id into a PostgREST filter string.
 */
export function asUuid(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return UUID_PATTERN.test(trimmed) ? trimmed.toLowerCase() : null;
}

export function isValidEmail(value: unknown): value is string {
  return typeof value === "string" && EMAIL_PATTERN.test(value.trim());
}

/**
 * Maps a display nickname/username to a deterministic internal ASCII email address
 * used by Supabase Auth so that users can register and sign in
 * using only their nickname and password, without needing an email.
 */
export function nicknameToInternalEmail(rawNickname: string): string {
  const clean = rawNickname.trim().toLowerCase();
  // If clean contains only ASCII alphanumeric and simple characters
  if (/^[a-z0-9_.-]+$/.test(clean)) {
    return `${clean}@sohba.local`;
  }
  // Otherwise encode unicode/Arabic characters into hex string to guarantee valid RFC 5322 ASCII email
  const hex = Buffer.from(clean, "utf8").toString("hex");
  return `u_${hex}@sohba.local`;
}

/**
 * Validates a `YYYY-MM-DD` date and returns it, or null.
 * Rejects impossible calendar days such as 2024-02-31.
 */
export function asIsoDate(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!ISO_DATE_PATTERN.test(trimmed)) return null;

  const [year, month, day] = trimmed.split("-").map((part) => Number(part));
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }
  return trimmed;
}

/**
 * Trims a value and enforces a maximum length.
 * Returns null when the value is not a string.
 */
export function cleanText(value: unknown, maxLength: number): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (trimmed.length === 0) return null;
  return trimmed.length > maxLength ? trimmed.slice(0, maxLength) : trimmed;
}

/**
 * Removes characters that are never valid inside a free-text field
 * (control characters) while keeping Arabic text and newlines intact.
 */
const CONTROL_CHARACTERS = new RegExp(
  "[\\u0000-\\u0008\\u000B\\u000C\\u000E-\\u001F\\u007F]",
  "g"
);

export function stripControlCharacters(value: string): string {
  return value.replace(CONTROL_CHARACTERS, "");
}

/**
 * Guards against open redirects: only same-site absolute paths are allowed.
 * Protocol-relative URLs (`//evil.com`), backslash tricks (`/\evil.com`) and
 * absolute URLs are rejected.
 */
export function sanitizeRedirectPath(value: unknown, fallback = "/"): string {
  if (typeof value !== "string") return fallback;

  const trimmed = value.trim();
  if (!trimmed.startsWith("/")) return fallback;
  if (trimmed.startsWith("//") || trimmed.startsWith("/\\")) return fallback;
  if (/[\r\n\t]/.test(trimmed)) return fallback;
  // "/http://evil.com" style payloads
  if (/^\/+[a-z][a-z0-9+.-]*:/i.test(trimmed)) return fallback;

  return trimmed;
}

/**
 * Accepts only http(s) URLs or a Supabase storage path inside the avatars
 * bucket. Blocks `javascript:`, `data:` and other script-bearing schemes.
 */
export function sanitizeAvatarUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;

  const trimmed = value.trim();
  if (!trimmed) return null;

  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const parsed = new URL(trimmed);
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
        return null;
      }
      return parsed.toString();
    } catch {
      return null;
    }
  }

  // Relative storage path, e.g. "avatars/<uid>/file.png" or "<uid>/file.png"
  if (/^[A-Za-z0-9._/-]+$/.test(trimmed) && !trimmed.includes("..")) {
    return trimmed;
  }

  return null;
}

/**
 * Normalizes a list of free-text interests coming from a form field.
 * Accepts a JSON array or a comma separated string, drops invalid entries and
 * enforces a maximum count and per-item length.
 */
export function normalizeInterests(
  value: unknown,
  maxItems = 10,
  maxItemLength = 30
): string[] {
  let candidates: unknown[] = [];

  if (typeof value === "string") {
    const raw = value.trim();
    if (!raw) return [];
    if (raw.startsWith("[")) {
      try {
        const parsed: unknown = JSON.parse(raw);
        if (Array.isArray(parsed)) candidates = parsed;
      } catch {
        candidates = raw.split(",");
      }
    } else {
      candidates = raw.split(",");
    }
  } else if (Array.isArray(value)) {
    candidates = value;
  }

  const result: string[] = [];
  const seen = new Set<string>();

  for (const candidate of candidates) {
    if (typeof candidate !== "string") continue;
    const item = candidate.replace(/^[\s"'\[\]]+|[\s"'\[\]]+$/g, "").trim();
    if (!item || item.length > maxItemLength) continue;
    const key = item.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(item);
    if (result.length >= maxItems) break;
  }

  return result;
}

/**
 * Maps a database error to a safe, user-facing Arabic message.
 * The raw error is logged on the server and never returned to the browser,
 * so internal details (table names, constraints, SQL) cannot leak.
 */
export function toSafeErrorMessage(
  error: { code?: string; message?: string } | null | undefined,
  fallback: string
): string {
  if (!error) return fallback;

  const code = error.code ?? "";

  // Keep the original message in the server logs for debugging.
  console.error("[sohba] database error:", code, error.message);

  switch (code) {
    case "23505":
      return "هذه البيانات مسجلة مسبقاً.";
    case "23503":
      return "البيانات المرجعية غير موجودة.";
    case "23514":
    case "22P02":
      return fallback;
    case "42501":
      return "ليست لديك صلاحية تنفيذ هذا الإجراء.";
    case "PGRST202":
    case "42883":
      return "لم يتم تجهيز قاعدة البيانات بعد. يرجى من المشرف تشغيل تحديثات قاعدة البيانات.";
    default:
      return fallback;
  }
}
