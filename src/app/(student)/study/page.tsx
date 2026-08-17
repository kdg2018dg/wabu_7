"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { compressImage } from "@/lib/image-compress";
import { newImagePath, STUDY_PHOTOS_BUCKET } from "@/lib/storage";
import { todayKST } from "@/lib/time";
import { Card } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";

type Mode = "duration" | "range";

interface Entry {
  key: string;
  studyDate: string;
  mode: Mode;
  hours: string;
  minutes: string;
  startTime: string;
  endTime: string;
  memo: string;
  file: File | null;
  previewUrl: string | null;
}

function newEntry(remembered?: RememberedInput | null): Entry {
  return {
    key: crypto.randomUUID(),
    studyDate: todayKST(),
    mode: remembered?.mode ?? "duration",
    hours: remembered?.hours ?? "",
    minutes: remembered?.minutes ?? "",
    startTime: remembered?.startTime ?? "",
    endTime: remembered?.endTime ?? "",
    memo: "",
    file: null,
    previewUrl: null,
  };
}

const REMEMBER_KEY = "study-entry-last-input";

interface RememberedInput {
  mode: Mode;
  hours: string;
  minutes: string;
  startTime: string;
  endTime: string;
}

function readRememberedInput(): RememberedInput | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(REMEMBER_KEY);
    return raw ? (JSON.parse(raw) as RememberedInput) : null;
  } catch {
    return null;
  }
}

function rememberInput(entry: Entry) {
  if (typeof window === "undefined") return;
  const toSave: RememberedInput = {
    mode: entry.mode,
    hours: entry.hours,
    minutes: entry.minutes,
    startTime: entry.startTime,
    endTime: entry.endTime,
  };
  try {
    window.localStorage.setItem(REMEMBER_KEY, JSON.stringify(toSave));
  } catch {
    // 저장 실패해도 무시 (사파리 프라이빗 모드 등)
  }
}

function computeDuration(entry: Entry): number | null {
  if (entry.mode === "duration") {
    const h = Number(entry.hours || 0);
    const m = Number(entry.minutes || 0);
    const total = h * 60 + m;
    return total > 0 ? total : null;
  }
  if (!entry.startTime || !entry.endTime) return null;
  const [sh, sm] = entry.startTime.split(":").map(Number);
  const [eh, em] = entry.endTime.split(":").map(Number);
  const total = eh * 60 + em - (sh * 60 + sm);
  return total > 0 ? total : null;
}

function timesOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  return aStart < bEnd && bStart < aEnd;
}

/** 같은 제출 묶음 안에서 같은 날짜·겹치는 시간대를 찾아 경고용으로 entry key를 반환 */
function findBatchOverlaps(entries: Entry[]): Set<string> {
  const overlapping = new Set<string>();
  for (let i = 0; i < entries.length; i++) {
    const a = entries[i];
    if (a.mode !== "range" || !a.startTime || !a.endTime) continue;
    for (let j = i + 1; j < entries.length; j++) {
      const b = entries[j];
      if (b.mode !== "range" || !b.startTime || !b.endTime) continue;
      if (a.studyDate !== b.studyDate) continue;
      if (timesOverlap(a.startTime, a.endTime, b.startTime, b.endTime)) {
        overlapping.add(a.key);
        overlapping.add(b.key);
      }
    }
  }
  return overlapping;
}

/** DB에 이미 있는(반려 제외) 인증과 겹치는지 확인 */
function findExistingOverlaps(
  entries: Entry[],
  existing: { study_date: string; start_time: string | null; end_time: string | null }[]
): Set<string> {
  const overlapping = new Set<string>();
  for (const entry of entries) {
    if (entry.mode !== "range" || !entry.startTime || !entry.endTime) continue;
    const sameDate = existing.filter((e) => e.study_date === entry.studyDate && e.start_time && e.end_time);
    for (const e of sameDate) {
      if (timesOverlap(entry.startTime, entry.endTime, e.start_time!.slice(0, 5), e.end_time!.slice(0, 5))) {
        overlapping.add(entry.key);
      }
    }
  }
  return overlapping;
}

export default function StudySubmitPage() {
  const [entries, setEntries] = useState<Entry[]>([newEntry()]);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [existingByDate, setExistingByDate] = useState<
    Record<string, { study_date: string; start_time: string | null; end_time: string | null }[]>
  >({});

  // 겹치는 시간대인지 학생에게 미리 알려준다 (제출을 막지는 않음 — 관리자가 최종 판단)
  const batchOverlaps = findBatchOverlaps(entries);
  const dbOverlaps = findExistingOverlaps(entries, Object.values(existingByDate).flat());
  const overlapKeys = new Set([...batchOverlaps, ...dbOverlaps]);

  // 날짜가 바뀔 때마다 그 날짜에 이미 제출된(반려 제외) 인증을 가져와 겹침 확인에 사용
  useEffect(() => {
    const datesToCheck = [...new Set(entries.map((e) => e.studyDate))].filter((d) => !(d in existingByDate));
    if (datesToCheck.length === 0) return;

    let cancelled = false;
    (async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("study_sessions")
        .select("study_date, start_time, end_time")
        .eq("user_id", user.id)
        .neq("status", "rejected")
        .in("study_date", datesToCheck);

      if (cancelled) return;
      setExistingByDate((prev) => {
        const next = { ...prev };
        for (const d of datesToCheck) {
          next[d] = (data ?? []).filter((row) => row.study_date === d);
        }
        return next;
      });
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entries.map((e) => e.studyDate).join(",")]);

  // 마운트 후에만 localStorage를 읽어 첫 칸에 이전 입력값을 채워준다 (하이드레이션 불일치 방지)
  useEffect(() => {
    const remembered = readRememberedInput();
    if (!remembered) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 로컬스토리지 초기 동기화는 예외적으로 필요
    setEntries((prev) =>
      prev.length === 1 && !prev[0].hours && !prev[0].minutes && !prev[0].startTime
        ? [{ ...prev[0], mode: remembered.mode, hours: remembered.hours, minutes: remembered.minutes, startTime: remembered.startTime, endTime: remembered.endTime }]
        : prev
    );
  }, []);

  function updateEntry(key: string, patch: Partial<Entry>) {
    setEntries((prev) => prev.map((e) => (e.key === key ? { ...e, ...patch } : e)));
  }

  function addEntry() {
    setEntries((prev) => [...prev, newEntry(readRememberedInput())]);
  }

  function removeEntry(key: string) {
    setEntries((prev) => (prev.length > 1 ? prev.filter((e) => e.key !== key) : prev));
  }

  function onFileChange(key: string, file: File | null) {
    updateEntry(key, {
      file,
      previewUrl: file ? URL.createObjectURL(file) : null,
    });
  }

  async function onSubmit() {
    setResult(null);

    for (const entry of entries) {
      if (!entry.file) {
        setResult({ type: "error", text: "모든 인증에 사진을 첨부해주세요." });
        return;
      }
      if (computeDuration(entry) === null) {
        setResult({ type: "error", text: "공부시간을 확인해주세요 (0분 이하이거나 값이 비어있어요)." });
        return;
      }
    }

    setSubmitting(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setSubmitting(false);
      setResult({ type: "error", text: "로그인이 만료되었습니다. 다시 로그인해주세요." });
      return;
    }

    let successCount = 0;
    for (const entry of entries) {
      const duration = computeDuration(entry)!;
      const compressed = await compressImage(entry.file!);
      const path = newImagePath(user.id, compressed.name);

      const { error: uploadError } = await supabase.storage
        .from(STUDY_PHOTOS_BUCKET)
        .upload(path, compressed, { contentType: compressed.type });

      if (uploadError) continue;

      const { error: insertError } = await supabase.from("study_sessions").insert({
        user_id: user.id,
        study_date: entry.studyDate,
        start_time: entry.mode === "range" ? entry.startTime : null,
        end_time: entry.mode === "range" ? entry.endTime : null,
        duration_minutes: duration,
        memo: entry.memo || null,
        image_path: path,
        status: "pending",
      });

      if (!insertError) successCount++;
    }

    setSubmitting(false);

    if (successCount === entries.length) {
      rememberInput(entries[entries.length - 1]);
      setResult({ type: "success", text: `인증 ${successCount}건을 제출했어요. 관리자 승인 후 반영됩니다.` });
      setEntries([newEntry(readRememberedInput())]);
    } else if (successCount > 0) {
      setResult({ type: "error", text: `${successCount}건만 제출되었어요. 나머지는 잠시 후 다시 시도해주세요.` });
    } else {
      setResult({ type: "error", text: "인증을 제출하지 못했습니다. 잠시 후 다시 시도해주세요." });
    }
  }

  return (
    <div>
      <PageHeader title="공부시간 인증" subtitle="사진과 함께 제출하면 관리자 승인 후 반영돼요" compact />

      <div className="flex flex-col gap-4 px-5 pb-6">
        {entries.map((entry, idx) => (
          <Card key={entry.key} className="p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-bold">인증 {idx + 1}</p>
              {entries.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeEntry(entry.key)}
                  className="text-xs font-semibold text-[var(--color-ink-soft)]"
                >
                  삭제
                </button>
              )}
            </div>

            {overlapKeys.has(entry.key) && (
              <p className="mb-3 rounded-lg bg-[#fbe9e9] px-3 py-2 text-xs font-medium text-[var(--color-rose)]">
                ⚠️ 같은 날짜에 시간이 겹치는 인증이 있어요. 확인 후 제출해주세요 (제출은 가능하며 관리자가 최종 확인해요).
              </p>
            )}

            <div className="flex flex-col gap-3">
              <label className="flex flex-col gap-1.5 text-sm font-medium">
                공부 날짜
                <input
                  type="date"
                  value={entry.studyDate}
                  max={todayKST()}
                  onChange={(e) => updateEntry(entry.key, { studyDate: e.target.value })}
                  className="input"
                />
              </label>

              <div className="flex items-center gap-2">
                <ModeButton
                  active={entry.mode === "duration"}
                  onClick={() => updateEntry(entry.key, { mode: "duration" })}
                >
                  시간 직접 입력
                </ModeButton>
                <ModeButton
                  active={entry.mode === "range"}
                  onClick={() => updateEntry(entry.key, { mode: "range" })}
                >
                  시작~종료 시간
                </ModeButton>
              </div>

              {entry.mode === "duration" ? (
                <div className="flex items-center gap-2">
                  <label className="flex flex-1 flex-col gap-1.5 text-sm font-medium">
                    시간
                    <input
                      type="number"
                      min={0}
                      max={24}
                      inputMode="numeric"
                      value={entry.hours}
                      onChange={(e) => updateEntry(entry.key, { hours: e.target.value })}
                      placeholder="0"
                      className="input"
                    />
                  </label>
                  <label className="flex flex-1 flex-col gap-1.5 text-sm font-medium">
                    분
                    <input
                      type="number"
                      min={0}
                      max={59}
                      inputMode="numeric"
                      value={entry.minutes}
                      onChange={(e) => updateEntry(entry.key, { minutes: e.target.value })}
                      placeholder="0"
                      className="input"
                    />
                  </label>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <label className="flex flex-1 flex-col gap-1.5 text-sm font-medium">
                    시작
                    <input
                      type="time"
                      value={entry.startTime}
                      onChange={(e) => updateEntry(entry.key, { startTime: e.target.value })}
                      className="input"
                    />
                  </label>
                  <label className="flex flex-1 flex-col gap-1.5 text-sm font-medium">
                    종료
                    <input
                      type="time"
                      value={entry.endTime}
                      onChange={(e) => updateEntry(entry.key, { endTime: e.target.value })}
                      className="input"
                    />
                  </label>
                </div>
              )}

              <div>
                <p className="mb-1.5 text-sm font-medium">
                  인증 사진 <span className="font-normal text-[var(--color-ink-soft)]">(열품타, 플래너, 독서실 기록 등)</span>
                </p>
                {entry.previewUrl ? (
                  <div className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={entry.previewUrl}
                      alt="인증 사진 미리보기"
                      className="h-44 w-full rounded-2xl border-2 border-[var(--color-brand)] object-cover"
                    />
                    <label className="absolute bottom-2 right-2 flex cursor-pointer items-center gap-1.5 rounded-full bg-[var(--color-ink)]/80 px-3 py-1.5 text-xs font-semibold text-white">
                      <CameraIcon />
                      다시 선택
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => onFileChange(entry.key, e.target.files?.[0] ?? null)}
                      />
                    </label>
                  </div>
                ) : (
                  <label className="flex h-32 w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[var(--color-brand)]/40 bg-[var(--color-brand-soft)] text-[var(--color-brand)]">
                    <CameraIcon size={28} />
                    <span className="text-sm font-bold">사진 촬영 / 선택하기</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => onFileChange(entry.key, e.target.files?.[0] ?? null)}
                    />
                  </label>
                )}
              </div>

              <label className="flex flex-col gap-1.5 text-sm font-medium">
                메모 (선택)
                <input
                  value={entry.memo}
                  onChange={(e) => updateEntry(entry.key, { memo: e.target.value })}
                  placeholder="예: 수학 오답노트 정리"
                  className="input"
                />
              </label>
            </div>
          </Card>
        ))}

        <button type="button" onClick={addEntry} className="btn-ghost">
          + 인증 추가하기 (몰아서 제출)
        </button>

        {result && (
          <p
            className="text-sm font-semibold"
            style={{ color: result.type === "success" ? "var(--color-mint)" : "var(--color-rose)" }}
          >
            {result.text}
          </p>
        )}

        <button type="button" disabled={submitting} onClick={onSubmit} className="btn-primary">
          {submitting ? "제출 중..." : `인증 ${entries.length}건 제출하기`}
        </button>

        <Link href="/study/history" className="text-center text-sm font-semibold text-[var(--color-brand)]">
          내 인증 기록 보기
        </Link>
      </div>
    </div>
  );
}

function CameraIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="13.5" r="3.2" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function ModeButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex-1 rounded-xl py-2.5 text-sm font-semibold"
      style={{
        background: active ? "var(--color-brand)" : "var(--color-brand-soft)",
        color: active ? "var(--color-brand-ink)" : "var(--color-brand)",
      }}
    >
      {children}
    </button>
  );
}
