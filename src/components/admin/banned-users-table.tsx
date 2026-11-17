"use client";

import { useState, useTransition } from "react";
import { unbanUser, banUser, type BannedUserItem } from "@/lib/actions/admin";
import { Alert } from "@/components/ui/alert";
import { Avatar } from "@/components/ui/avatar";
import { Modal } from "@/components/ui/modal";
import { IconCheckSeal, IconBan } from "@/components/ui/icons";
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
        <span className="text-xs font-bold text-white/70">
          إجمالي الحسابات المحظورة: {bans.length}
        </span>
        <button
          type="button"
          onClick={() => setShowManualModal(true)}
          className="rounded-full bg-[#FF453A] px-4 py-2 text-xs font-bold text-white shadow-xs transition-all hover:bg-[#FF6961] active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF453A]"
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
        <div className="ios-card rounded-[28px] p-12 text-center text-white/55">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-[18px] border border-[#30D158]/30 bg-[#30D158]/15 text-[#30D158]">
            <IconCheckSeal size={28} />
          </div>
          <p className="text-sm font-bold text-white">لا توجد حسابات محظورة حالياً</p>
          <p className="mt-1 text-xs text-white/45">
            جميع الأعضاء ملتزمون بالقواعد أو تم إلغاء حظرهم.
          </p>
        </div>
      ) : (
        <div className="ios-card overflow-x-auto rounded-[28px]">
          <table className="w-full text-start text-xs">
            <caption className="sr-only">
              الحسابات المحظورة في منصة صحبة
            </caption>
            <thead className="border-b border-white/[0.10] bg-white/[0.04] font-bold text-white/65">
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
            <tbody className="divide-y divide-white/[0.08]">
              {bans.map((ban) => (
                <tr
                  key={ban.id}
                  className="transition-colors hover:bg-white/[0.04]"
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar
                        src={ban.avatarUrl}
                        name={ban.nickname}
                        size="xs"
                        fallbackClassName="text-xs font-bold text-[#409CFF]"
                      />
                      <div>
                        <p className="font-bold text-white">{ban.nickname}</p>
                        <p className="font-mono text-[10px] text-white/40">
                          {ban.userId.slice(0, 8)}...
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="max-w-xs px-5 py-4 font-medium text-white/80">
                    {ban.reason}
                  </td>

                  <td className="px-5 py-4">
                    {ban.isPermanent ? (
                      <span className="rounded-full border border-[#FF453A]/35 bg-[#FF453A]/15 px-2.5 py-0.5 text-[11px] font-bold text-[#FF8982]">
                        حظر دائم
                      </span>
                    ) : (
                      <span className="rounded-full border border-[#FF9F0A]/35 bg-[#FF9F0A]/15 px-2.5 py-0.5 text-[11px] font-bold text-[#FFD080]">
                        مؤقت حتى{" "}
                        {ban.bannedUntil
                          ? new Date(ban.bannedUntil).toLocaleDateString("ar-EG")
                          : ""}
                      </span>
                    )}
                  </td>

                  <td className="px-5 py-4 text-white/55">
                    {new Date(ban.createdAt).toLocaleDateString("ar-EG")}
                  </td>

                  <td className="px-5 py-4 text-end">
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => handleUnban(ban.userId)}
                      className="rounded-full border border-[#30D158]/35 bg-[#30D158]/15 px-3.5 py-1.5 text-xs font-bold text-[#7AE897] transition-all hover:bg-[#30D158]/25 active:scale-95 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#30D158]"
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
          <span aria-hidden="true" className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#FF453A]/15 text-[#FF453A]">
            <IconBan size={18} />
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
