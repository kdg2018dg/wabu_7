"use client";

import { useState } from "react";
import { Card, Pill } from "@/components/Card";
import type { Profile, RosterEntry } from "@/lib/database.types";
import { NewRosterForm } from "./NewRosterForm";
import { RemoveRosterButton } from "./RemoveRosterButton";
import { RoleToggle } from "./RoleToggle";

export function StudentsSearch({
  roster,
  profiles,
}: {
  roster: RosterEntry[];
  profiles: Profile[];
}) {
  const [query, setQuery] = useState("");
  const q = query.trim();

  const filteredRoster = q
    ? roster.filter((r) => r.name.includes(q) || r.student_number.includes(q))
    : roster;
  const filteredProfiles = q
    ? profiles.filter((p) => p.name.includes(q) || p.student_number.includes(q))
    : profiles;

  return (
    <>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="이름 또는 학번으로 검색"
        className="input mb-4 !min-h-10 text-sm md:max-w-xs"
      />

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <p className="mb-2 text-sm font-bold">가입 명단 (roster)</p>
          <Card className="mb-3 p-4">
            <NewRosterForm />
          </Card>
          <Card className="divide-y divide-[var(--color-line)]">
            {filteredRoster.length === 0 && (
              <p className="px-4 py-6 text-center text-sm text-[var(--color-ink-soft)]">검색 결과가 없어요.</p>
            )}
            {filteredRoster.map((r) => (
              <div key={r.student_number} className="flex items-center justify-between px-4 py-2.5">
                <div>
                  <p className="text-sm font-semibold">{r.name}</p>
                  <p className="text-xs text-[var(--color-ink-soft)]">{r.student_number}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Pill tone={r.claimed ? "mint" : "muted"}>{r.claimed ? "가입완료" : "미가입"}</Pill>
                  {!r.claimed && <RemoveRosterButton studentNumber={r.student_number} />}
                </div>
              </div>
            ))}
          </Card>
        </div>

        <div>
          <p className="mb-2 text-sm font-bold">가입된 계정</p>
          <Card className="divide-y divide-[var(--color-line)]">
            {filteredProfiles.length === 0 && (
              <p className="px-4 py-6 text-center text-sm text-[var(--color-ink-soft)]">
                {profiles.length === 0 ? "아직 가입한 계정이 없어요." : "검색 결과가 없어요."}
              </p>
            )}
            {filteredProfiles.map((p) => (
              <div key={p.id} className="flex items-center justify-between px-4 py-2.5">
                <div>
                  <p className="text-sm font-semibold">{p.name}</p>
                  <p className="text-xs text-[var(--color-ink-soft)]">{p.student_number}</p>
                </div>
                <RoleToggle profileId={p.id} role={p.role} />
              </div>
            ))}
          </Card>
        </div>
      </div>
    </>
  );
}
