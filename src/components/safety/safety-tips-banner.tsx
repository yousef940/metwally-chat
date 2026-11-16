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
      className="group mb-6 overflow-hidden rounded-2xl border border-amber-200 bg-amber-50/70 p-4 text-amber-900 shadow-sm"
    >
      <summary className="flex cursor-pointer list-none items-start justify-between gap-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700">
        <span className="flex items-center gap-2">
          <span aria-hidden="true" className="text-xl">
            🛡️
          </span>
          <span className="text-sm font-bold text-amber-950">
            إرشادات الأمان والحماية لمجتمع صحبة
          </span>
        </span>
        <span className="text-xs font-semibold text-amber-700 group-open:hidden">
          عرض النصائح ▼
        </span>
        <span className="hidden text-xs font-semibold text-amber-700 group-open:inline">
          إخفاء النصائح ▲
        </span>
      </summary>

      <div className="mt-3 space-y-2 border-t border-amber-200/60 pt-3 text-xs leading-relaxed text-amber-900/90">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {SAFETY_TIPS.map((tip) => (
            <div key={tip.title} className="flex items-start gap-2">
              <span aria-hidden="true" className="font-bold text-coral">
                •
              </span>
              <p>
                <strong>{tip.title}</strong> {tip.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </details>
  );
}
