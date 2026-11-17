import { getCountryFlag } from "@/lib/constants";

interface CountryBadgeProps {
  country?: string | null;
  city?: string | null;
  className?: string;
  showCity?: boolean;
}

export function CountryBadge({
  country,
  city,
  className = "",
  showCity = true,
}: CountryBadgeProps) {
  if (!country) return null;

  const flag = getCountryFlag(country);

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border border-white/[0.10] bg-white/[0.07] px-2.5 py-1 text-xs font-medium text-white/90 ${className}`}
      title={`${country}${city ? ` - ${city}` : ""}`}
    >
      <span className="text-sm" aria-hidden="true">
        {flag}
      </span>
      <span>{country}</span>
      {showCity && city && (
        <>
          <span className="text-white/30">•</span>
          <span className="text-white/65">{city}</span>
        </>
      )}
    </span>
  );
}
