"use client";

import { useState, useTransition } from "react";
import { toggleRoomActive, saveRoom } from "@/lib/actions/admin";
import { Alert } from "@/components/ui/alert";
import { Modal } from "@/components/ui/modal";
import {
  compactInputClassName,
  compactTextareaClassName,
} from "@/components/ui/form-control";
import type { Room } from "@/components/rooms/types";

interface RoomManagementTableProps {
  initialRooms: Room[];
}

export function RoomManagementTable({ initialRooms }: RoomManagementTableProps) {
  const [rooms, setRooms] = useState<Room[]>(initialRooms);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Edit / Create Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [country, setCountry] = useState("جميع الدول");
  const [topic, setTopic] = useState("عام");
  const [isActive, setIsActive] = useState(true);

  const openCreateModal = () => {
    setEditingRoom(null);
    setName("");
    setSlug("");
    setDescription("");
    setCountry("جميع الدول");
    setTopic("نقاش عام");
    setIsActive(true);
    setShowModal(true);
  };

  const openEditModal = (room: Room) => {
    setEditingRoom(room);
    setName(room.name);
    setSlug(room.slug);
    setDescription(room.description || "");
    setCountry(room.country || "جميع الدول");
    setTopic(room.topic || "عام");
    setIsActive(room.is_active);
    setShowModal(true);
  };

  const handleToggleActive = (roomId: string, currentStatus: boolean) => {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const nextStatus = !currentStatus;
      const res = await toggleRoomActive(roomId, nextStatus);
      if (res.error) {
        setError(res.error);
      } else {
        setRooms((prev) =>
          prev.map((r) => (r.id === roomId ? { ...r, is_active: nextStatus } : r))
        );
        setSuccess(`تم ${nextStatus ? "تفعيل" : "إيقاف"} الغرفة بنجاح.`);
      }
    });
  };

  const handleSaveRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !slug.trim()) return;

    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const res = await saveRoom({
        id: editingRoom?.id,
        name: name.trim(),
        slug: slug.trim(),
        description: description.trim() || undefined,
        country: country.trim() || undefined,
        topic: topic.trim() || undefined,
        isActive,
      });

      if (res.error) {
        setError(res.error);
      } else {
        setSuccess(
          editingRoom ? "تم تعديل الغرفة بنجاح." : "تم إنشاء الغرفة بنجاح."
        );
        setShowModal(false);
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-white/70">
          إجمالي الغرف: {rooms.length}
        </span>
        <button
          type="button"
          onClick={openCreateModal}
          className="ios-btn-primary rounded-full px-4 py-2 text-xs font-bold transition-all active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0A84FF]"
        >
          + إنشاء غرفة جديدة
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

      {/* Table */}
      <div className="ios-card overflow-x-auto rounded-[28px]">
        <table className="w-full text-start text-xs">
          <caption className="sr-only">غرف المحادثة العامة في منصة صحبة</caption>
          <thead className="border-b border-white/[0.10] bg-white/[0.04] font-bold text-white/65">
            <tr>
              <th scope="col" className="px-5 py-3 text-start">
                اسم الغرفة
              </th>
              <th scope="col" className="px-5 py-3 text-start">
                الرابط (Slug)
              </th>
              <th scope="col" className="px-5 py-3 text-start">
                الدولة / الموضوع
              </th>
              <th scope="col" className="px-5 py-3 text-start">
                الحالة
              </th>
              <th scope="col" className="px-5 py-3 text-end">
                الإجراءات
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.08]">
            {rooms.map((room) => (
              <tr key={room.id} className="transition-colors hover:bg-white/[0.04]">
                <td className="px-5 py-4">
                  <p className="font-bold text-white">{room.name}</p>
                  <p className="line-clamp-1 text-[11px] text-white/50">
                    {room.description}
                  </p>
                </td>

                <td className="px-5 py-4 font-mono text-white/70">
                  /rooms/{room.slug}
                </td>

                <td className="px-5 py-4">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {room.country && (
                      <span className="rounded-full border border-white/[0.10] bg-white/[0.06] px-2.5 py-0.5 text-[11px] font-semibold text-white/90">
                        {room.country}
                      </span>
                    )}
                    {room.topic && (
                      <span className="rounded-full border border-[#0A84FF]/30 bg-[#0A84FF]/15 px-2.5 py-0.5 text-[11px] font-semibold text-[#409CFF]">
                        {room.topic}
                      </span>
                    )}
                  </div>
                </td>

                <td className="px-5 py-4">
                  <span
                    className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${
                      room.is_active
                        ? "border-[#30D158]/35 bg-[#30D158]/15 text-[#7AE897]"
                        : "border-white/15 bg-white/[0.08] text-white/55"
                    }`}
                  >
                    {room.is_active ? "نشطة" : "معطلة"}
                  </span>
                </td>

                <td className="px-5 py-4 text-end">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => handleToggleActive(room.id, room.is_active)}
                      className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all active:scale-95 ${
                        room.is_active
                          ? "ios-btn-glass text-white/75"
                          : "border-[#30D158]/35 bg-[#30D158]/15 text-[#7AE897] hover:bg-[#30D158]/25"
                      }`}
                    >
                      {room.is_active ? "إيقاف" : "تفعيل"}
                    </button>

                    <button
                      type="button"
                      onClick={() => openEditModal(room)}
                      className="rounded-full border border-[#0A84FF]/35 bg-[#0A84FF]/15 px-3.5 py-1.5 text-xs font-semibold text-[#409CFF] transition-all hover:bg-[#0A84FF]/25 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0A84FF]"
                    >
                      تعديل
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingRoom ? "تعديل الغرفة" : "إنشاء غرفة جديدة"}
      >
        <form onSubmit={handleSaveRoom} className="mt-4 space-y-4">
          <div>
            <label
              htmlFor="room-name"
              className="mb-1 block text-xs font-bold text-ink/80"
            >
              اسم الغرفة *
            </label>
            <input
              id="room-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثال: شات مصر والمحروسة"
              className={compactInputClassName}
            />
          </div>

          <div>
            <label
              htmlFor="room-slug"
              className="mb-1 block text-xs font-bold text-ink/80"
            >
              الرابط التعريفي (Slug) *
            </label>
            <input
              id="room-slug"
              type="text"
              required
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="مثال: egypt-chat"
              className={`${compactInputClassName} font-mono`}
            />
          </div>

          <div>
            <label
              htmlFor="room-country"
              className="mb-1 block text-xs font-bold text-ink/80"
            >
              الدولة
            </label>
            <input
              id="room-country"
              type="text"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              placeholder="مثال: مصر أو جميع الدول"
              className={compactInputClassName}
            />
          </div>

          <div>
            <label
              htmlFor="room-topic"
              className="mb-1 block text-xs font-bold text-ink/80"
            >
              الموضوع
            </label>
            <input
              id="room-topic"
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="مثال: نقاش عام، رياضة، ثقافة..."
              className={compactInputClassName}
            />
          </div>

          <div>
            <label
              htmlFor="room-description"
              className="mb-1 block text-xs font-bold text-ink/80"
            >
              الوصف
            </label>
            <textarea
              id="room-description"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="وصف مختصر لطبيعة الغرفة..."
              className={compactTextareaClassName}
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="roomActiveCheck"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="rounded border-ink/20 text-coral focus:ring-coral"
            />
            <label
              htmlFor="roomActiveCheck"
              className="text-xs font-bold text-ink/80"
            >
              تفعيل الغرفة وجعلها متاحة للأعضاء
            </label>
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-ink/10 pt-2">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="rounded-xl border border-ink/15 px-4 py-2 text-xs font-semibold text-ink/70 transition-colors hover:bg-cream focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="rounded-xl bg-coral px-5 py-2 text-xs font-bold text-white shadow-xs transition-colors hover:bg-coral-hover disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral"
            >
              {isPending ? "جاري الحفظ..." : "حفظ الغرفة"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
