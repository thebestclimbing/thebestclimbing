"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { FeedMedia } from "../types";
import { SubmitButton } from "@/components/SubmitButton";

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!;
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!;
const MAX_FILES = 10;

async function uploadToCloudinary(file: File): Promise<FeedMedia> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`,
    { method: "POST", body: formData }
  );
  if (!res.ok) throw new Error("Cloudinary 업로드 실패");
  const data = await res.json();

  const isVideo = data.resource_type === "video";
  const url: string = data.secure_url;
  const thumbnail_url = isVideo
    ? url.replace(/\.[^/.]+$/, ".jpg")
    : url;

  return {
    url,
    type: isVideo ? "video" : "image",
    thumbnail_url,
    public_id: data.public_id,
  };
}

export default function FeedUploadForm({ authorId }: { authorId: string }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previews, setPreviews] = useState<{ file: File; objectUrl: string }[]>([]);
  const [caption, setCaption] = useState("");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    const total = previews.length + files.length;
    if (total > MAX_FILES) {
      setError(`최대 ${MAX_FILES}개까지 업로드 가능합니다.`);
      return;
    }
    setError("");
    const newPreviews = files.map((file) => ({
      file,
      objectUrl: URL.createObjectURL(file),
    }));
    setPreviews((prev) => [...prev, ...newPreviews]);
  }

  function removeFile(index: number) {
    setPreviews((prev) => {
      URL.revokeObjectURL(prev[index].objectUrl);
      return prev.filter((_, i) => i !== index);
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (previews.length === 0) {
      setError("사진 또는 동영상을 추가해 주세요.");
      return;
    }
    setError("");
    setUploading(true);
    setProgress(0);

    try {
      const mediaItems: FeedMedia[] = [];
      for (let i = 0; i < previews.length; i++) {
        const item = await uploadToCloudinary(previews[i].file);
        mediaItems.push(item);
        setProgress(Math.round(((i + 1) / previews.length) * 100));
      }

      const supabase = createClient();
      const { error: dbError } = await supabase.from("feed_posts").insert({
        author_id: authorId,
        caption: caption.trim(),
        media: mediaItems,
      });

      if (dbError) throw new Error(dbError.message);

      previews.forEach((p) => URL.revokeObjectURL(p.objectUrl));
      router.push("/feed");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "업로드 중 오류가 발생했습니다.");
      setUploading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card rounded-2xl p-6">
      {/* 파일 선택 영역 */}
      <div
        className="mb-4 flex min-h-[160px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-[var(--border)] bg-[var(--surface-muted)] transition hover:border-[var(--primary)]"
        onClick={() => fileInputRef.current?.click()}
      >
        <svg className="mb-2 h-10 w-10 text-[var(--chalk-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
        </svg>
        <p className="text-sm text-[var(--chalk-muted)]">
          사진/동영상 선택 (최대 {MAX_FILES}개)
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          multiple
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {/* 미리보기 */}
      {previews.length > 0 && (
        <div className="mb-4 grid grid-cols-3 gap-2">
          {previews.map((p, i) => (
            <div key={i} className="relative aspect-square overflow-hidden rounded-lg">
              {p.file.type.startsWith("video/") ? (
                <video src={p.objectUrl} className="h-full w-full object-cover" muted />
              ) : (
                <img src={p.objectUrl} alt="" className="h-full w-full object-cover" />
              )}
              <button
                type="button"
                onClick={() => removeFile(i)}
                className="absolute right-1 top-1 rounded-full bg-black/60 p-0.5 text-white hover:bg-black/80"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 캡션 */}
      <div className="mb-4">
        <label className="mb-1 block text-sm text-[var(--chalk-muted)]">캡션 (선택)</label>
        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          rows={3}
          placeholder="클라이밍 이야기를 남겨보세요..."
          className="input-base min-h-[80px]"
        />
      </div>

      {/* 업로드 진행률 */}
      {uploading && (
        <div className="mb-4">
          <div className="mb-1 flex justify-between text-xs text-[var(--chalk-muted)]">
            <span>업로드 중...</span>
            <span>{progress}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-[var(--surface-muted)]">
            <div
              className="h-1.5 rounded-full bg-[var(--primary)] transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {error && <p className="mb-3 text-sm text-red-500">{error}</p>}

      <div className="flex gap-2">
        <SubmitButton loading={uploading} loadingLabel="업로드 중..." className="btn-primary disabled:pointer-events-none">
          게시
        </SubmitButton>
        <Link href="/feed" className="btn-outline inline-block px-4 py-3 text-center text-sm">
          취소
        </Link>
      </div>
    </form>
  );
}
