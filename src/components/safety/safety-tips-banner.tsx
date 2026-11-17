interface SafetyTipsBannerProps {
  /** When true the tips start collapsed (the banner is only a short notice). */
  compact?: boolean;
}

const SAFETY_TIPS = [
  {
    title: "لا تحوّل أي أموال:",
    body: "لا ترسل مبالغ مالية أو كروت شحن أو رصيد لأي شخص تعرفت عليه عبر الإنترنت تحت أي ظرف.",
  },
  {
    title: "احذر من الابتزاز:",
    body: "لا تشارك صوراً خاصة أو مقاطع حساسة أو معلومات بنكية قد تُستخدم ضدك لاحقاً.",
  },
  {
    title: "حافظ على خصوصيتك:",
    body: "تجنب مشاركة عنوان سكنك التفصيلي أو أرقام وثائقك الرسمية مع الغرباء.",
  },
  {
    title: "استخدم أدوات الأمان:",
    body: "يمكنك فوراً حظر أي مستخدم مزعج أو تقديم بلاغ لإدارة المنصة لنتعامل معه بحزم.",
  },
];

/**
 * Prominent safety tips banner designed to protect adult users from
 * financial scams, identity theft, and online extortion / blackmail.
 *
 * It uses the native `details` element, so it works without JavaScript and
 * stays keyboard accessible.
 */
export function SafetyTipsBanner({ compact = false }: SafetyTipsBannerProps) {
  return (
    <details
      open={!compact}
      className="group mb-6 overflow-hidden rounded-[22px] border border-[#FF9F0A]/30 bg-[#FF9F0A]/12 backdrop-blur-xl p-4 text-white/90"
    >
      <summary className="flex cursor-pointer list-none items-start justify-between gap-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF9F0A]">
        <span className="flex items-center gap-2">
          <span aria-hidden="true" className="text-xl">
            🛡️
          </span>
          <span className="text-sm font-bold text-[#FFD080]">
            إرشادات الأمان والحماية لمجتمع صحبة
          </span>
        </span>
        <span className="text-xs font-semibold text-[#FF9F0A] group-open:hidden">
          عرض النصائح ▼
        </span>
        <span className="hidden text-xs font-semibold text-[#FF9F0A] group-open:inline">
          إخفاء النصائح ▲
        </span>
      </summary>

      <div className="mt-3 space-y-2 border-t border-[#FF9F0A]/20 pt-3 text-xs leading-relaxed text-white/80">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {SAFETY_TIPS.map((tip) => (
            <div key={tip.title} className="flex items-start gap-2">
              <span aria-hidden="true" className="font-bold text-[#FF9F0A]">
                •
              </span>
              <p>
                <strong className="text-white">{tip.title}</strong> {tip.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </details>
  );
}
