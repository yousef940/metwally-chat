import { requireAdmin } from "@/lib/admin";
import { RoomManagementTable } from "@/components/admin/room-management-table";
import type { Room } from "@/components/rooms/types";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "إدارة الغرف العامة - لوحة التحكم",
};

export default async function AdminRoomsPage() {
  const { supabase } = await requireAdmin();

  const { data: rawRooms } = await supabase
    .from("rooms")
    .select("*")
    .order("created_at", { ascending: true });

  const rooms: Room[] = (rawRooms || []) as Room[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">إدارة غرف المحادثة العامة</h1>
        <p className="mt-1 text-xs sm:text-sm text-ink/70">
          تعديل وتفعيل أو إيقاف غرف الدردشة حسب الدولة والموضوع، وإضافة غرف جديدة للمجتمع.
        </p>
      </div>

      <RoomManagementTable initialRooms={rooms} />
    </div>
  );
}
