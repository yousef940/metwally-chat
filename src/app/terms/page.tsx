import Link from "next/link";

export const metadata = {
  title: "شروط الاستخدام - صحبة",
  description: "شروط وقواعد استخدام منصة صحبة للتعارف والدردشة",
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <div className="ios-glass rounded-[30px] p-6 sm:p-10">
        <h1 className="text-3xl font-black text-white">شروط الاستخدام</h1>
        <p className="mt-2 text-sm text-white/55">آخر تحديث: نوفمبر 2026</p>

        <div className="mt-8 space-y-6 text-base leading-relaxed text-white/80">
          <section>
            <h2 className="text-xl font-semibold text-ink">1. الأهلية والعمر القانوني (18+)</h2>
            <p className="mt-2">
              منصة <strong>صحبة</strong> مخصصة حصرياً للبالغين بعمر 18 سنة فما فوق. لا يُسمح لأي شخص يقل عمره عن 18 عاماً بالتسجيل أو استخدام خدمات المنصة تحت أي ظرف. التسجيل بمعلومات أو تاريخ ميلاد غير حقيقي يُعد خرقاً صريحاً للاتفاقية ويؤدي إلى حظر الحساب فوراً.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-ink">2. أهداف المنصة والسلوك العام</h2>
            <p className="mt-2">
              تهدف المنصة إلى بناء علاقات تعارف وصداقة وزواج جاد في إطار من الاحترام المتبادل والقيم الأخلاقية. يُحظر تماماً:
            </p>
            <ul className="mt-2 list-inside list-disc space-y-1">
              <li>نشر أو إرسال أي محتوى مسيء، إباحي، تحريضي، أو تشهيري.</li>
              <li>ممارسة التحرش، الابتزاز، أو التهديد بأي شكل من الأشكال.</li>
              <li>الاحتيال أو محاولة استدراج المستخدمين لعمليات مالية مشبوهة.</li>
              <li>استخدام الحسابات الوهمية أو انتحال شخصيات الآخرين.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-ink">3. سياسة مكافحة السبام والإعلانات</h2>
            <p className="mt-2">
              تلتزم المنصة بتوفير بيئة دردشة آمنة وخالية من الرسائل المزعجة. تُمنع الحسابات الجديدة من نشر أرقام الهواتف أو الروابط الخارجية في الغرف العامة خلال فترات البداية، ويحق للإدارة حظر أي حساب يمارس الإغراق الإعلاني (Spam).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-ink">4. إنهاء الحسابات والبيانات</h2>
            <p className="mt-2">
              يحق لك حذف حسابك وبياناتك في أي وقت من خلال إعدادات الحساب، وسيتم حذف معلوماتك المرتبطة فورياً. كما تحتفظ الإدارة بالحق في إيقاف أو حظر أي حساب يخالف قواعد الأمان وشروط الاستخدام.
            </p>
          </section>
        </div>

        <div className="mt-10 border-t border-white/[0.10] pt-6">
          <Link
            href="/register"
            className="ios-btn-primary inline-flex items-center justify-center rounded-full px-6 py-2.5 text-sm font-semibold transition-all active:scale-95"
          >
            العودة إلى التسجيل
          </Link>
        </div>
      </div>
    </div>
  );
}
