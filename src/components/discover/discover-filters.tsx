"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState, useTransition } from "react";
import { ARAB_COUNTRIES, getCountryFlag } from "@/lib/constants";

interface DiscoverFiltersProps {
  initialCountry?: string;
  initialGender?: string;
  initialIntent?: string;
  initialMinAge?: number;
  initialMaxAge?: number;
  initialSearch?: string;
}

const MIN_AGE = 1;
const MAX_AGE = 80;

export function DiscoverFilters({
  initialCountry = "",
  initialGender = "",
  initialMinAge = MIN_AGE,
  initialMaxAge = MAX_AGE,
  initialSearch = "",
}: DiscoverFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [country, setCountry] = useState(initialCountry);
  const [gender, setGender] = useState(initialGender);
  const [minAge, setMinAge] = useState<number>(initialMinAge);
  const [maxAge, setMaxAge] = useState<number>(initialMaxAge);
  const [search, setSearch] = useState(initialSearch);
  const [isExpanded, setIsExpanded] = useState(false);

  const applyFilters = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());

    params.delete("page");

    if (country) params.set("country", country);
    else params.delete("country");

    if (gender) params.set("gender", gender);
    else params.delete("gender");

    if (minAge > MIN_AGE) params.set("min_age", minAge.toString());
    else params.delete("min_age");

    if (maxAge < MAX_AGE) params.set("max_age", maxAge.toString());
    else params.delete("max_age");

    if (search.trim()) params.set("search", search.trim());
    else params.delete("search");

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  const resetFilters = () => {
    setCountry("");
    setGender("");
    setMinAge(MIN_AGE);
    setMaxAge(MAX_AGE);
    setSearch("");
    startTransition(() => {
      router.push(pathname);
    });
  };

  const hasActiveFilters =
    Boolean(country) ||
    Boolean(gender) ||
    Boolean(search) ||
    minAge > MIN_AGE ||
    maxAge < MAX_AGE;

  return (
    <div className="mb-6 rounded-2xl border border-[#20454E] bg-[#122A31] p-4 shadow-sm">
      <form onSubmit={applyFilters} className="space-y-4">
        {/* Search & Actions Bar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 start-0 flex items-center ps-3 text-[#9CB3B8]"
            >
              🔍
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث بالاسم المستعار أو الاهتمامات..."
              aria-label="البحث عن أعضاء"
              className="w-full rounded-xl border border-[#20454E] bg-[#0E252D] py-2.5 pe-4 ps-10 text-sm text-white placeholder-[#6B858D] focus:border-coral focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              aria-expanded={isExpanded}
              aria-controls="discover-advanced-filters"
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#20454E] bg-[#16353D] px-3.5 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-[#1C424D] sm:hidden"
            >
              <span>⚙️</span>
              <span>{isExpanded ? "إخفاء الفلاتر" : "الفلاتر"}</span>
            </button>

            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-1.5 rounded-xl bg-coral px-5 py-2.5 text-xs font-bold text-white shadow-sm transition-colors hover:bg-coral-hover focus-visible:outline-2 focus-visible:outline-coral disabled:opacity-50"
            >
              <span>تطبيق</span>
            </button>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="rounded-xl border border-[#20454E] px-3 py-2.5 text-xs font-medium text-[#9CB3B8] transition-colors hover:bg-[#16353D] hover:text-white"
              >
                إلغاء
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div
          id="discover-advanced-filters"
          className={`grid grid-cols-1 gap-4 border-t border-[#20454E] pt-3 sm:grid-cols-3 ${isExpanded ? "block" : "hidden sm:grid"}`}
        >
          {/* Gender Filter */}
          <div>
            <label
              htmlFor="discover-gender"
              className="mb-1.5 block text-xs font-bold text-[#FFF7EF]"
            >
              الجنس
            </label>
            <select
              id="discover-gender"
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="w-full rounded-xl border border-[#20454E] bg-[#0E252D] px-3 py-2 text-xs text-white focus:border-coral focus:outline-none"
            >
              <option value="">الجميع (ذكر وأنثى)</option>
              <option value="male">👨 ذكر</option>
              <option value="female">👩 أنثى</option>
            </select>
          </div>

          {/* Country Filter */}
          <div>
            <label
              htmlFor="discover-country"
              className="mb-1.5 block text-xs font-bold text-[#FFF7EF]"
            >
              الدولة
            </label>
            <select
              id="discover-country"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full rounded-xl border border-[#20454E] bg-[#0E252D] px-3 py-2 text-xs text-white focus:border-coral focus:outline-none"
            >
              <option value="">جميع الدول</option>
              {ARAB_COUNTRIES.map((countryName) => (
                <option key={countryName} value={countryName}>
                  {getCountryFlag(countryName)} {countryName}
                </option>
              ))}
            </select>
          </div>

          {/* Age Range Filter */}
          <div role="group" aria-labelledby="discover-age-label">
            <span
              id="discover-age-label"
              className="mb-1.5 block text-xs font-bold text-[#FFF7EF]"
            >
              السن ({minAge} - {maxAge} سنة)
            </span>
            <div className="flex items-center gap-2">
              <input
                id="discover-min-age"
                type="number"
                min={MIN_AGE}
                max={maxAge}
                value={minAge}
                onChange={(e) => setMinAge(Number(e.target.value))}
                className="w-1/2 rounded-xl border border-[#20454E] bg-[#0E252D] px-2.5 py-1.5 text-center text-xs text-white focus:border-coral focus:outline-none"
                placeholder="من"
                aria-label="أقل عمر"
              />
              <span className="text-xs text-[#9CB3B8]">إلى</span>
              <input
                id="discover-max-age"
                type="number"
                min={minAge}
                max={MAX_AGE}
                value={maxAge}
                onChange={(e) => setMaxAge(Number(e.target.value))}
                className="w-1/2 rounded-xl border border-[#20454E] bg-[#0E252D] px-2.5 py-1.5 text-center text-xs text-white focus:border-coral focus:outline-none"
                placeholder="إلى"
                aria-label="أعلى عمر"
              />
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
