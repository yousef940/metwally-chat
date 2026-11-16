/**
 * Arabic Dialect Profanity & Spam Filter.
 *
 * Provides text normalization, multi-dialect abuse detection,
 * offensive word masking, and contact-info/link detection (anti-spam).
 *
 * The blocked vocabulary lives in ONE place: `BLOCKED_WORDS` (single tokens)
 * and `BLOCKED_PHRASES` (multi-word expressions). To extend the filter, add
 * the new expression to the relevant list — no other file needs to change.
 */

/**
 * Single-word expressions that are blocked across Arab dialects.
 * Entries shorter than four characters are matched as whole words only, so
 * innocent words that merely contain them (e.g. "الزبدة", "خولة") are safe.
 */
export const BLOCKED_WORDS: string[] = [
  // Profanities and explicit insults
  "شرموط",
  "قحبة",
  "منيوك",
  "ديوث",
  "عرص",
  "خول",
  "كسك",
  "طيز",
  "سكس",
  "نيك",
  "تناك",
  "انكح",
  "اباحي",
  "بزبوز",
  "شاذ",
  "لوطي",
  "زب",
  "كلب",
  "حمار",

  // Scam and harassment triggers
  "هاكر",
  "تهكير",
  "ابتزاز",
  "بفضحك",
  "اعتداء",
  "تحرش",
];

/**
 * Multi-word expressions. Matched as a sequence of words, so extra spacing
 * or a leading "ال" does not bypass the filter.
 */
export const BLOCKED_PHRASES: string[] = [
  "كس امك",
  "كس اختك",
  "يلعن امك",
  "يلعن ابوك",
  "ابن الكلب",
  "ابن الحرام",
  "ابن القحبة",
  "يا عرص",
  "يا منيوك",
  "يا خول",
  "كاميرا خاصه بمقابل",
  "كاميرا خاصة بمقابل",
  "شات صوتي بمقابل",
  "تحويل رصيد",
  "كروت شحن",
  "كرت شحن",
  "ارسل لي رصيد",
  "ابعث لي رصيد",
  "سالب رصيد",
];

/** The single, authoritative list of blocked expressions. */
export const BLOCKED_PATTERNS: string[] = [
  ...BLOCKED_WORDS,
  ...BLOCKED_PHRASES,
];

/** Tashkeel, harakat and Quranic annotation marks. */
const TASHKEEL_PATTERN = /[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED]/g;
/** Tatweel / kashida. */
const TATWEEL_PATTERN = /\u0640/g;
/** Zero width and bidirectional control characters used to break filters. */
const INVISIBLE_PATTERN = /[\u200B-\u200F\u202A-\u202E\u2060\uFEFF]/g;
/** Arabic-Indic and Extended Arabic-Indic digits. */
const ARABIC_INDIC_DIGITS_PATTERN = /[\u0660-\u0669\u06F0-\u06F9]/g;
/** A run of three or more identical characters. */
const REPEATED_CHARACTERS_PATTERN = /(.)\1{2,}/g;

/**
 * Normalizes Arabic text by removing tashkeel and tatweel, unifying alef
 * forms, teh marbuta and alef maksura, dropping invisible characters,
 * collapsing repeated characters and lowercasing the result.
 */
export function normalizeArabicText(text: string): string {
  if (!text) return "";

  return text
    .replace(TASHKEEL_PATTERN, "")
    .replace(TATWEEL_PATTERN, "")
    .replace(INVISIBLE_PATTERN, "")
    // Normalize alefs (أ إ آ) to ا
    .replace(/[أإآ]/g, "ا")
    // Normalize hamza carriers: ؤ -> و, ئ -> ي
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    // Normalize teh marbuta to heh
    .replace(/ة/g, "ه")
    // Normalize alef maksura to yeh
    .replace(/ى/g, "ي")
    .replace(REPEATED_CHARACTERS_PATTERN, "$1")
    .toLowerCase()
    .trim();
}

/** Converts Arabic-Indic digits to western digits. */
function toWesternDigits(text: string): string {
  return text.replace(ARABIC_INDIC_DIGITS_PATTERN, (digit) =>
    String(digit.charCodeAt(0) & 0x0f)
  );
}

/** Removes a leading "ال" definite article from a normalized token. */
function stripDefiniteArticle(token: string): string {
  return /^ال(?=.{2,})/.test(token) ? token.slice(2) : token;
}

interface Token {
  original: string;
  normalized: string;
  stripped: string;
}

function tokenize(text: string): Token[] {
  return text
    .split(/\s+/)
    .filter((part) => part.length > 0)
    .map((part) => {
      const normalized = normalizeArabicText(part);
      return {
        original: part,
        normalized,
        stripped: stripDefiniteArticle(normalized),
      };
    });
}

/**
 * A single word is blocked when it matches exactly, when it matches after
 * removing the "ال" prefix, or — for longer words — when it is contained in
 * the token (so "الشرموط" and "مايلشرموط" are caught).
 */
function isBlockedWord(token: Token, pattern: string): boolean {
  if (!pattern) return false;
  if (token.normalized === pattern || token.stripped === pattern) return true;
  if (pattern.length >= 4) {
    return token.normalized.includes(pattern) || token.stripped.includes(pattern);
  }
  return false;
}

/**
 * Locates a phrase inside the token list. Returns the range of tokens that
 * covers the matched phrase, or null when the phrase is absent.
 */
function findPhraseRange(
  tokens: Token[],
  pattern: string
): { start: number; end: number } | null {
  const parts: string[] = [];
  const offsets: number[] = [];
  let cursor = 0;

  for (const token of tokens) {
    parts.push(token.normalized);
    offsets.push(cursor);
    cursor += token.normalized.length + 1;
  }

  const sentence = parts.join(" ");
  const index = sentence.indexOf(pattern);
  if (index === -1) return null;

  const lastIndex = index + pattern.length - 1;

  let start = 0;
  for (let i = 0; i < offsets.length; i++) {
    if (offsets[i] <= index) start = i;
  }

  let end = start;
  for (let i = 0; i < offsets.length; i++) {
    if (offsets[i] <= lastIndex) end = i;
  }

  return { start, end };
}

/**
 * Checks if the text contains any offensive word or phrase.
 */
export function containsProfanity(text: string, customList?: string[]): boolean {
  if (!text) return false;

  const patterns = customList && customList.length > 0 ? customList : BLOCKED_PATTERNS;
  const tokens = tokenize(text);

  if (tokens.length === 0) return false;

  for (const rawPattern of patterns) {
    const pattern = normalizeArabicText(rawPattern);
    if (!pattern) continue;

    if (pattern.includes(" ")) {
      if (findPhraseRange(tokens, pattern)) return true;
      continue;
    }

    for (const token of tokens) {
      if (isBlockedWord(token, pattern)) return true;
    }
  }

  return false;
}

/** Replaces the letter core of a token with asterisks, keeping punctuation. */
function maskToken(token: string): string {
  return token.replace(/\p{L}[\p{L}\p{M}]*/gu, "***");
}

/**
 * Replaces offensive words with asterisks (***).
 */
export function maskProfanity(text: string, customList?: string[]): string {
  if (!text) return text;

  const patterns = customList && customList.length > 0 ? customList : BLOCKED_PATTERNS;
  const tokens = tokenize(text);
  if (tokens.length === 0) return text;

  const maskedTokens = tokens.map((token) => ({ ...token, masked: false }));

  for (const rawPattern of patterns) {
    const pattern = normalizeArabicText(rawPattern);
    if (!pattern) continue;

    if (pattern.includes(" ")) {
      const range = findPhraseRange(tokens, pattern);
      if (range) {
        for (let i = range.start; i <= range.end; i++) maskedTokens[i].masked = true;
      }
      continue;
    }

    for (let i = 0; i < tokens.length; i++) {
      if (isBlockedWord(tokens[i], pattern)) {
        maskedTokens[i].masked = true;
      }
    }
  }

  // Rebuild the original text, masking only the offending tokens.
  let result = "";
  for (let i = 0; i < tokens.length; i++) {
    if (i > 0) result += " ";
    result += maskedTokens[i].masked
      ? maskToken(tokens[i].original)
      : tokens[i].original;
  }

  // Preserve the original leading/trailing whitespace shape.
  const leading = text.match(/^\s*/)?.[0] ?? "";
  const trailing = text.match(/\s*$/)?.[0] ?? "";
  return `${leading}${result}${trailing}`;
}

/**
 * Regular expressions for links and URLs.
 * These are intentionally NOT global: a global regex used with `test()`
 * keeps its `lastIndex` between calls and returns alternating results.
 */
const URL_REGEX = /(?:https?:\/\/|ftp:\/\/|www\.)[^\s/$.?#].[^\s]*/i;
const DOMAIN_REGEX =
  /[a-zA-Z0-9-]+\.(com|net|org|io|app|co|me|xyz|info|link|site|top|club|vip|online|shop|store)(?![a-zA-Z])/i;
/** Eight or more consecutive digits (western or Arabic-Indic). */
const LONG_DIGITS_REGEX = /\d{8,}/;
/** A digit group that may contain separators, e.g. "0100 123 4567". */
const SPACED_DIGITS_REGEX = /(?:\+?\d[\d\s().-]*\d)/g;

/**
 * Checks whether text contains phone numbers or external URLs.
 * Used for anti-spam enforcement on newly created accounts.
 */
export function containsLinksOrPhones(text: string): boolean {
  if (!text) return false;

  const normalized = toWesternDigits(text);

  if (URL_REGEX.test(normalized) || DOMAIN_REGEX.test(normalized)) {
    return true;
  }

  if (LONG_DIGITS_REGEX.test(normalized)) {
    return true;
  }

  // Spaced / grouped numbers: only treat them as phones when the shape is
  // phone-like (country code, leading zero, or a long grouped number).
  const groups = normalized.match(SPACED_DIGITS_REGEX) ?? [];
  for (const group of groups) {
    const digits = group.replace(/\D/g, "");
    if (digits.length < 8) continue;

    const parts = group
      .split(/[\s().-]+/)
      .map((part) => part.replace(/\D/g, ""))
      .filter(Boolean);
    if (parts.length === 0) continue;

    // A list of years ("2024 - 2025") is not a phone number.
    const allYearLike = parts.every(
      (part) => part.length === 4 && Number(part) >= 1900 && Number(part) <= 2100
    );
    if (allYearLike) continue;

    const firstPart = parts[0];
    const hasCountryCode = group.trim().startsWith("+");
    const hasLeadingZero = firstPart.startsWith("0");
    const looksLikePhone = digits.length >= 9 && firstPart.length <= 4;

    if (hasCountryCode || hasLeadingZero || looksLikePhone) {
      return true;
    }
  }

  return false;
}

export interface MessageSafetyCheckResult {
  isAllowed: boolean;
  reason?: string;
  cleanedText: string;
}

/** Maximum length of a public room message. */
export const ROOM_MESSAGE_MAX_LENGTH = 2000;
/** Maximum length of a private message. */
export const PRIVATE_MESSAGE_MAX_LENGTH = 5000;

/**
 * Comprehensive message safety validation before saving to room or direct chat.
 */
export function validateMessageSafety(
  rawText: string,
  maxLength: number = ROOM_MESSAGE_MAX_LENGTH
): MessageSafetyCheckResult {
  const trimmed = rawText?.trim() || "";

  if (!trimmed) {
    return { isAllowed: false, reason: "الرسالة فارغة", cleanedText: "" };
  }

  // Enforce length limit
  if (trimmed.length > maxLength) {
    return {
      isAllowed: false,
      reason: `تتجاوز الرسالة الحد الأقصى المسموح به (${maxLength} حرف).`,
      cleanedText: trimmed,
    };
  }

  // Check profanity (excluding internal media tags)
  const textWithoutImages = trimmed.replace(/\[image:[^\]]+\]/g, "");
  if (containsProfanity(textWithoutImages)) {
    return {
      isAllowed: false,
      reason: "تحتوي الرسالة على كلمات غير لائقة أو مسيئة تخالف قواعد عائلة الحاج متولي.",
      cleanedText: maskProfanity(trimmed),
    };
  }

  return { isAllowed: true, cleanedText: trimmed };
}
