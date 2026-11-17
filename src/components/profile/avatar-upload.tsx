"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Avatar } from "@/components/ui/avatar";
import { IconUser } from "@/components/ui/icons";

interface AvatarUploadProps {
  userId: string;
  initialUrl?: string | null;
  onUploadComplete: (url: string) => void;
}

const MAX_FILE_SIZE_BYTES = 4 * 1024 * 1024;

export function AvatarUpload({
  userId,
  initialUrl,
  onUploadComplete,
}: AvatarUploadProps) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initialUrl || null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setError(null);
      setUploading(true);

      if (!e.target.files || e.target.files.length === 0) {
        return;
      }

      const file = e.target.files[0];

      if (file.size > MAX_FILE_SIZE_BYTES) {
        setError("حجم الصورة يجب ألا يتجاوز 4 ميغابايت.");
        setUploading(false);
        return;
      }

      if (!file.type.startsWith("image/")) {
        setError("يرجى اختيار ملف صورة صالح (JPEG, PNG, WebP).");
        setUploading(false);
        return;
      }

      const fileExt = file.name.split(".").pop();
      const filePath = `${userId}/${Date.now()}.${fileExt}`;

      const supabase = createClient();

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) {
        // If storage bucket doesn't exist yet, show friendly guidance
        if (uploadError.message.includes("Bucket not found")) {
          setError(
            "حاوية الصور (avatars) لم يتم إنشاؤها بعد في Supabase. يرجى تطبيق سكربت 0002_profiles_and_storage.sql"
          );
        } else {
          setError("تعذر رفع الصورة: " + uploadError.message);
        }
        setUploading(false);
        return;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(filePath);

      setAvatarUrl(publicUrl);
      onUploadComplete(publicUrl);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "حدث خطأ غير متوقع أثناء الرفع."
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-start">
      <Avatar
        src={avatarUrl}
        name="الصورة الشخصية"
        size="xl"
        frameClassName="border-2 border-white/25 bg-[#2C2C2E] shadow-lg"
        fallbackClassName="text-3xl text-white/50"
        fallback={<IconUser size={44} className="text-white/45" />}
      />

      <div className="space-y-1.5">
        <label className="ios-btn-glass inline-flex cursor-pointer items-center justify-center rounded-full px-4.5 py-2 text-sm font-semibold text-white transition-all active:scale-95 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[#0A84FF]">
          {uploading ? "جاري رفع الصورة..." : "تغيير الصورة الشخصية"}
          <input
            type="file"
            accept="image/*"
            disabled={uploading}
            onChange={handleFileChange}
            className="sr-only"
          />
        </label>
        <p className="text-xs text-white/55">
          صيغ JPEG أو PNG أو WebP بحد أقصى 4 ميغابايت.
        </p>
        {error && (
          <p role="alert" className="text-xs font-semibold text-[#FF6961]">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
