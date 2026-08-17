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

/**
 * 여러 이미지의 서명 URL을 한 번의 네트워크 요청으로 발급받는다.
 * (사진이 많은 목록 화면에서 getSignedImageUrl 을 N번 호출하면 N번의 왕복이 생겨 느려지므로,
 * 이 배치 함수를 사용해 요청을 1번으로 묶는다.)
 */
export async function getSignedImageUrls(
  supabase: SupabaseClient,
  paths: string[],
  bucket: string = STUDY_BUCKET
): Promise<Map<string, string | null>> {
  const map = new Map<string, string | null>();
  if (paths.length === 0) return map;

  const { data, error } = await supabase.storage.from(bucket).createSignedUrls(paths, 60 * 60);
  if (error || !data) {
    for (const p of paths) map.set(p, null);
    return map;
  }

  // createSignedUrls 는 입력 paths 와 같은 순서로 결과를 반환한다 (Supabase 문서 기준).
  paths.forEach((p, i) => {
    const item = data[i];
    map.set(p, item && !item.error ? item.signedUrl : null);
  });
  return map;
}

export { STUDY_BUCKET as STUDY_PHOTOS_BUCKET, CLASS_BUCKET as CLASS_PHOTOS_BUCKET };
