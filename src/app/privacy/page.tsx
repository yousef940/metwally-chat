import Link from "next/link";

export const metadata = {
  title: "سياسة الخصوصية - صحبة",
  description: "سياسة حماية البيانات والخصوصية لمستخدمي منصة صحبة",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <div className="ios-glass rounded-[30px] p-6 sm:p-10">
        <h1 className="text-3xl font-black text-white">سياسة الخصوصية</h1>
        <p className="mt-2 text-sm text-white/55">آخر تحديث: نوفمبر 2026</p>

        <div className="mt-8 space-y-6 text-base leading-relaxed text-white/80">
          <section>
            <h2 className="text-xl font-semibold text-ink">1. حماية بياناتك الحساسة</h2>
            <p className="mt-2">
              في منصة <strong>صحبة</strong>، خصوصيتك خط أحمر. نطبق أعلى معايير الأمان التقنية لعزل وحماية بياناتك الشخصية:
            </p>
            <ul className="mt-2 list-inside list-disc space-y-1">
              <li><strong>البريد الإلكتروني:</strong> لا يُعرض إطلاقاً لأي مستخدم آخر على المنصة ويُستخدم فقط للتوثيق والتنبيهات.</li>
              <li><strong>تاريخ الميلاد الكامل:</strong> يُخزن في سجلات منفصلة ومحمية، ولا يُعرض للمستخدمين الآخرين سوى العمر المحسوب بالأرقام فقط.</li>
              <li><strong>الموقع الدقيق:</strong> لا نطلب ولا نعرض موقعك الجغرافي الدقيق (GPS). يظهر للآخرين فقط اسم الدولة والمدينة التي تختار مشاركتهما.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-ink">2. البيانات المعروضة في الملف الشخصي</h2>
            <p className="mt-2">
              البيانات الوحيدة التي يمكن للمستخدمين الآخرين رؤيتها هي: الاسم المستعار، الصورة الشخصية (إن وُجدت)، النبذة التعريفية، العمر، الدولة، المدينة، والهدف من التواجد (صداقة / تعارف جاد).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-ink">3. أدوات التحكم والخصوصية</h2>
            <p className="mt-2">
              نوفر لك خيارات تحكم كاملة في تجربتك:
            </p>
            <ul className="mt-2 list-inside list-disc space-y-1">
              <li>إمكانية حظر أي مستخدم، وعند الحظر لن يتمكن الطرفان من رؤية ملفات بعضهما أو مراسلة بعضهما.</li>
              <li>إمكانية الإبلاغ عن أي محتوى أو سلوك غير لائق للمراجعة الإدارية الفورية.</li>
              <li>حق حذف الحساب بالكامل وبياناته في أي وقت تشاء.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-ink">4. التواصل والدعم</h2>
            <p className="mt-2">
              إذا كانت لديك أي استفسارات حول خصوصيتك أو كيفية حماية بياناتك، يمكنك التواصل مع فريق الدعم والإشراف.
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
