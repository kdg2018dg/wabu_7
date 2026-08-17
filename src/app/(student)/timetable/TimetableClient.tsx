"use client";

import { Fragment, useState } from "react";
import {
  useTimetableQuery,
  useSetOverrideMutation,
  useResetOverrideMutation,
  useResetAllOverridesMutation,
} from "@/lib/queries/timetable";
import { WEEKDAY_LABEL, PERIODS } from "@/lib/schedule";
import { Card } from "@/components/Card";

export function TimetableClient({ userId }: { userId: string }) {
  const { data, isLoading } = useTimetableQuery(userId);
  const setOverride = useSetOverrideMutation(userId);
  const resetOverride = useResetOverrideMutation(userId);
  const resetAll = useResetAllOverridesMutation(userId);
  const [editingKey, setEditingKey] = useState<string | null>(null);

  const templateMap = new Map((data?.template ?? []).map((t) => [`${t.day_of_week}-${t.period}`, t]));
  const overrideMap = new Map((data?.overrides ?? []).map((o) => [`${o.day_of_week}-${o.period}`, o]));

  if (isLoading) {
    return (
      <Card className="p-8 text-center text-sm text-[var(--color-ink-soft)]">
        시간표를 불러오는 중...
      </Card>
    );
  }

  return (
    <>
      <p className="mb-2 px-1 text-xs text-[var(--color-ink-soft)] md:hidden">
        👉 옆으로 스크롤해서 전체 시간표를 확인하세요
      </p>
      <Card className="overflow-x-auto p-3">
        <div className="grid min-w-[560px] grid-cols-[40px_repeat(5,1fr)] gap-1.5">
          <div />
          {[1, 2, 3, 4, 5].map((d) => (
            <div key={d} className="py-1 text-center text-xs font-bold text-[var(--color-ink-soft)]">
              {WEEKDAY_LABEL[d]}
            </div>
          ))}
          {PERIODS.map((period) => (
            <Fragment key={period}>
              <div className="flex items-center justify-center text-xs font-bold text-[var(--color-ink-soft)]">
                {period}
              </div>
              {[1, 2, 3, 4, 5].map((d) => {
                const key = `${d}-${period}`;
                const override = overrideMap.get(key);
                const base = templateMap.get(key);
                const cell = override ?? base;
                return (
                  <div key={key} className="min-h-16">
                    <Cell
                      dayOfWeek={d}
                      period={period}
                      subject={cell?.subject ?? null}
                      teacher={cell?.teacher ?? null}
                      room={cell?.room ?? null}
                      isOverridden={!!override}
                      editing={editingKey === key}
                      onEdit={() => setEditingKey(key)}
                      onCancel={() => setEditingKey(null)}
                      onSave={(subject, teacher, room) => {
                        setOverride.mutate({ dayOfWeek: d, period, subject, teacher, room });
                        setEditingKey(null);
                      }}
                      onReset={() => resetOverride.mutate({ dayOfWeek: d, period })}
                    />
                  </div>
                );
              })}
            </Fragment>
          ))}
        </div>
      </Card>
      <div className="mt-3 flex items-center justify-between gap-2 px-1">
        <p className="text-xs text-[var(--color-ink-soft)]">
          보라색 배경 칸은 내가 직접 수정한 칸이에요.
        </p>
        {(data?.overrides.length ?? 0) > 0 && (
          <button
            disabled={resetAll.isPending}
            onClick={() => {
              if (confirm("내가 수정한 모든 칸을 학급 기본 시간표로 되돌릴까요?")) resetAll.mutate();
            }}
            className="shrink-0 text-xs font-semibold text-[var(--color-rose)]"
          >
            전체 초기화
          </button>
        )}
      </div>
    </>
  );
}

function Cell({
  subject,
  teacher,
  room,
  isOverridden,
  editing,
  onEdit,
  onCancel,
  onSave,
  onReset,
}: {
  dayOfWeek: number;
  period: number;
  subject: string | null;
  teacher: string | null;
  room: string | null;
  isOverridden: boolean;
  editing: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: (subject: string, teacher: string, room: string) => void;
  onReset: () => void;
}) {
  const [subjectVal, setSubjectVal] = useState(subject ?? "");
  const [teacherVal, setTeacherVal] = useState(teacher ?? "");
  const [roomVal, setRoomVal] = useState(room ?? "");

  if (editing) {
    return (
      <div className="flex flex-col gap-1 rounded-lg border border-[var(--color-brand)] bg-white p-1.5">
        <input
          value={subjectVal}
          onChange={(e) => setSubjectVal(e.target.value)}
          placeholder="과목"
          className="w-full rounded border border-[var(--color-line)] px-1.5 py-1 text-[11px]"
        />
        <input
          value={teacherVal}
          onChange={(e) => setTeacherVal(e.target.value)}
          placeholder="선생님"
          className="w-full rounded border border-[var(--color-line)] px-1.5 py-1 text-[11px]"
        />
        <input
          value={roomVal}
          onChange={(e) => setRoomVal(e.target.value)}
          placeholder="장소"
          className="w-full rounded border border-[var(--color-line)] px-1.5 py-1 text-[11px]"
        />
        <div className="flex gap-1">
          <button
            onClick={() => onSave(subjectVal, teacherVal, roomVal)}
            className="flex-1 rounded bg-[var(--color-brand)] py-1 text-[10px] font-bold text-white"
          >
            저장
          </button>
          <button onClick={onCancel} className="flex-1 rounded border border-[var(--color-line)] py-1 text-[10px] font-bold">
            취소
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex h-full w-full flex-col items-start gap-0.5 rounded-lg p-1.5 text-left transition-colors"
      style={{ background: isOverridden ? "var(--color-brand-soft)" : "var(--color-canvas)" }}
    >
      <button onClick={onEdit} className="flex w-full flex-col items-start gap-0.5 text-left">
        {subject ? (
          <>
            <span className="truncate text-[11px] font-semibold">{subject}</span>
            <span className="truncate text-[10px] text-[var(--color-ink-soft)]">{teacher}</span>
            {room && <span className="truncate text-[10px] text-[var(--color-ink-soft)]">{room}</span>}
          </>
        ) : (
          <span className="text-[10px] text-[var(--color-ink-soft)]">-</span>
        )}
      </button>
      {isOverridden && (
        <button onClick={onReset} className="mt-0.5 text-[9px] font-bold text-[var(--color-brand)]">
          기본으로
        </button>
      )}
    </div>
  );
}
