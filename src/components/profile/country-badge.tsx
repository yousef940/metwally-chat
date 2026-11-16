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
      className={`inline-flex items-center gap-1.5 rounded-lg border border-[#20454E] bg-[#16353D] px-2.5 py-1 text-xs font-medium text-[#FFF7EF] ${className}`}
      title={`${country}${city ? ` - ${city}` : ""}`}
    >
      <span className="text-sm" aria-hidden="true">
        {flag}
      </span>
      <span>{country}</span>
      {showCity && city && (
        <>
          <span className="text-white/30">•</span>
          <span className="text-white/80">{city}</span>
        </>
      )}
    </span>
  );
}
