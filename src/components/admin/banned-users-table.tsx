"use client";

import { useState, useTransition } from "react";
import { unbanUser, banUser, type BannedUserItem } from "@/lib/actions/admin";
import { Alert } from "@/components/ui/alert";
import { Avatar } from "@/components/ui/avatar";
import { Modal } from "@/components/ui/modal";
import {
  compactInputClassName,
  compactSelectClassName,
  compactTextareaClassName,
} from "@/components/ui/form-control";

interface BannedUsersTableProps {
  initialBans: BannedUserItem[];
}

export function BannedUsersTable({ initialBans }: BannedUsersTableProps) {
  const [bans, setBans] = useState<BannedUserItem[]>(initialBans);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Manual Ban Form State
  const [manualUserId, setManualUserId] = useState("");
  const [manualReason, setManualReason] = useState("");
  const [manualDays, setManualDays] = useState(7);
  const [showManualModal, setShowManualModal] = useState(false);

  const handleUnban = (userId: string) => {
    if (!confirm("هل أنت متأكد من رغبتك في رفع الحظر عن هذا الحساب؟")) return;
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const res = await unbanUser(userId);
      if (res.error) {
        setError(res.error);
      } else {
        setBans((prev) => prev.filter((b) => b.userId !== userId));
        setSuccess("تم إلغاء الحظر بنجاح.");
      }
    });
  };

  const handleManualBan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualUserId.trim() || !manualReason.trim()) return;

    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const duration = manualDays > 0 ? manualDays : null;
      const res = await banUser(
        manualUserId.trim(),
        manualReason.trim(),
        duration
      );
      if (res.error) {
        setError(res.error);
      } else {
        setSuccess("تم تسجيل الحظر بنجاح.");
        setShowManualModal(false);
        setManualUserId("");
        setManualReason("");
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-ink/70">
          إجمالي الحسابات المحظورة: {bans.length}
        </span>
        <button
          type="button"
          onClick={() => setShowManualModal(true)}
          className="rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white shadow-xs transition-colors hover:bg-red-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
        >
          + حظر مستخدم يدوياً
        </button>
      </div>

      {error && (
        <Alert tone="error" size="md" weight="normal">
          {error}
        </Alert>
      )}
      {success && (
        <Alert tone="success" size="md" weight="normal">
          {success}
        </Alert>
      )}

      {/* Bans Table / List */}
      {bans.length === 0 ? (
        <div className="rounded-3xl border border-ink/10 bg-white p-12 text-center text-ink/50 shadow-xs">
          <span aria-hidden="true" className="mb-2 block text-4xl">
            🕊️
          </span>
          <p className="text-sm font-bold">لا توجد حسابات محظورة حالياً</p>
          <p className="mt-1 text-xs text-ink/40">
            جميع الأعضاء ملتزمون بالقواعد أو تم إلغاء حظرهم.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-3xl border border-ink/10 bg-white shadow-xs">
          <table className="w-full text-start text-xs">
            <caption className="sr-only">
              الحسابات المحظورة في منصة صحبة
            </caption>
            <thead className="border-b border-ink/10 bg-cream/40 font-bold text-ink/70">
              <tr>
                <th scope="col" className="px-5 py-3 text-start">
                  المستخدم
                </th>
                <th scope="col" className="px-5 py-3 text-start">
                  سبب الحظر
                </th>
                <th scope="col" className="px-5 py-3 text-start">
                  نوع الحظر والمدة
                </th>
                <th scope="col" className="px-5 py-3 text-start">
                  تاريخ الحظر
                </th>
                <th scope="col" className="px-5 py-3 text-end">
                  الإجراءات
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/5">
              {bans.map((ban) => (
                <tr
                  key={ban.id}
                  className="transition-colors hover:bg-cream/20"
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar
                        src={ban.avatarUrl}
                        name={ban.nickname}
                        size="xs"
                        fallbackClassName="text-xs font-bold text-coral"
                      />
                      <div>
                        <p className="font-bold text-ink">{ban.nickname}</p>
                        <p className="font-mono text-[10px] text-ink/40">
                          {ban.userId.slice(0, 8)}...
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="max-w-xs px-5 py-4 font-medium text-ink/80">
                    {ban.reason}
                  </td>

                  <td className="px-5 py-4">
                    {ban.isPermanent ? (
                      <span className="rounded-md bg-red-100 px-2 py-0.5 text-[11px] font-bold text-red-700">
                        حظر دائم
                      </span>
                    ) : (
                      <span className="rounded-md bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-800">
                        مؤقت حتى{" "}
                        {ban.bannedUntil
                          ? new Date(ban.bannedUntil).toLocaleDateString("ar-EG")
                          : ""}
                      </span>
                    )}
                  </td>

                  <td className="px-5 py-4 text-ink/60">
                    {new Date(ban.createdAt).toLocaleDateString("ar-EG")}
                  </td>

                  <td className="px-5 py-4 text-end">
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => handleUnban(ban.userId)}
                      className="rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800 transition-colors hover:bg-emerald-100 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
                    >
                      إلغاء الحظر
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Manual Ban Modal */}
      <Modal
        isOpen={showManualModal}
        onClose={() => setShowManualModal(false)}
        title="حظر مستخدم يدوياً"
        titleClassName="flex items-center gap-2 text-base font-bold text-red-600"
        icon={
          <span aria-hidden="true" className="text-base">
            🚫
          </span>
        }
      >
        <form onSubmit={handleManualBan} className="mt-4 space-y-4">
          <div>
            <label
              htmlFor="manual-ban-user-id"
              className="mb-1 block text-xs font-bold text-ink/80"
            >
              معرّف المستخدم (User ID UUID) *
            </label>
            <input
              id="manual-ban-user-id"
              type="text"
              required
              value={manualUserId}
              onChange={(e) => setManualUserId(e.target.value)}
              placeholder="مثال: e2b60456-4bdf-48e0-..."
              className={`${compactInputClassName} font-mono`}
            />
          </div>

          <div>
            <label
              htmlFor="manual-ban-duration"
              className="mb-1 block text-xs font-bold text-ink/80"
            >
              المدة
            </label>
            <select
              id="manual-ban-duration"
              value={manualDays}
              onChange={(e) => setManualDays(Number(e.target.value))}
              className={compactSelectClassName}
            >
              <option value={1}>يوم واحد</option>
              <option value={3}>3 أيام</option>
              <option value={7}>أسبوع واحد</option>
              <option value={30}>شهر واحد</option>
              <option value={0}>حظر دائم نهائي</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="manual-ban-reason"
              className="mb-1 block text-xs font-bold text-ink/80"
            >
              سبب الحظر *
            </label>
            <textarea
              id="manual-ban-reason"
              rows={2}
              required
              value={manualReason}
              onChange={(e) => setManualReason(e.target.value)}
              placeholder="اكتب سبب الحظر بالتفصيل..."
              className={compactTextareaClassName}
            />
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-ink/10 pt-2">
            <button
              type="button"
              onClick={() => setShowManualModal(false)}
              className="rounded-xl border border-ink/15 px-4 py-2 text-xs font-semibold text-ink/70 transition-colors hover:bg-cream focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="rounded-xl bg-red-600 px-5 py-2 text-xs font-bold text-white transition-colors hover:bg-red-700 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
            >
              {isPending ? "جاري الحظر..." : "تأكيد الحظر"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
