import type { SupabaseClient } from "@supabase/supabase-js";

const STUDY_BUCKET = "study-photos";
const CLASS_BUCKET = "class-photos";

/** 로그인한 사용자가 업로드할 새 이미지 경로. RLS 상 첫 폴더가 본인 uid 여야 업로드 가능. */
export function newImagePath(userId: string, fileName: string) {
  const ext = fileName.split(".").pop() || "jpg";
  const random = crypto.randomUUID();
  return `${userId}/${random}.${ext}`;
}

/** 비공개 버킷의 이미지를 잠깐(1시간) 열람할 수 있는 서명 URL 발급 */
export async function getSignedImageUrl(
  supabase: SupabaseClient,
  path: string,
  bucket: string = STUDY_BUCKET
) {
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 60 * 60);
  if (error) return null;
  return data.signedUrl;
}

export { STUDY_BUCKET as STUDY_PHOTOS_BUCKET, CLASS_BUCKET as CLASS_PHOTOS_BUCKET };
