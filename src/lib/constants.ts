export const SITE_NAME = "متولي شات";
export const SITE_TAGLINE = "شات ومحادثات الأصدقاء";
export const SITE_DESCRIPTION = "منصة شات ودردشة وتواصل الأصدقاء";

export const THEME_COLORS = {
  background: "#000000",
  surface: "#1C1C1E",
  border: "rgba(255, 255, 255, 0.12)",
  coral: "#0A84FF",
  coralHover: "#409CFF",
  ink: "#FFFFFF",
  gold: "#E8D5B5",
} as const;

export const ARAB_COUNTRIES = [
  "مصر",
  "السعودية",
  "الإمارات",
  "المغرب",
  "الجزائر",
  "تونس",
  "العراق",
  "الأردن",
  "الكويت",
  "قطر",
  "عمان",
  "البحرين",
  "لبنان",
  "فلسطين",
  "اليمن",
  "السودان",
  "ليبيا",
  "سوريا",
  "موريتانيا",
  "بلد آخر",
] as const;

export const COUNTRY_FLAGS: Record<string, string> = {
  "مصر": "🇪🇬",
  "السعودية": "🇸🇦",
  "الإمارات": "🇦🇪",
  "المغرب": "🇲🇦",
  "الجزائر": "🇩🇿",
  "تونس": "🇹🇳",
  "العراق": "🇮🇶",
  "الأردن": "🇯🇴",
  "الكويت": "🇰🇼",
  "قطر": "🇶🇦",
  "عمان": "🇴🇲",
  "البحرين": "🇧🇭",
  "لبنان": "🇱🇧",
  "فلسطين": "🇵🇸",
  "اليمن": "🇾🇪",
  "السودان": "🇸🇩",
  "ليبيا": "🇱🇾",
  "سوريا": "🇸🇾",
  "موريتانيا": "🇲🇷",
  "بلد آخر": "🌐",
};

export function getCountryFlag(country?: string | null): string {
  if (!country) return "🌐";
  return COUNTRY_FLAGS[country.trim()] || "🌐";
}

export const GENDER_LABELS: Record<string, string> = {
  male: "ذكر",
  female: "أنثى",
};
