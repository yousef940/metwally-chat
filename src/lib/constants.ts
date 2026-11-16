export const SITE_NAME = "متولي شات";
export const SITE_TAGLINE = "شات ومحادثات الأصدقاء";
export const SITE_DESCRIPTION = "منصة شات ودردشة وتواصل الأصدقاء";

export const THEME_COLORS = {
  background: "#0B1E24",
  surface: "#122A31",
  border: "#20454E",
  coral: "#F26B4F",
  coralHover: "#E0563A",
  ink: "#FFF7EF",
  gold: "#D9A441",
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
