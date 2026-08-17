import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/Card";
import { DisplayModeForm } from "./DisplayModeForm";
import { ClearTestDataForm } from "./ClearTestDataForm";
import { ExportPanel } from "./ExportPanel";

export default async function AdminSettingsPage() {
  const supabase = await createClient();
  const { data: sample } = await supabase.from("profiles").select("display_name_mode").eq("role", "student").limit(1);
  const currentMode = sample?.[0]?.display_name_mode ?? "realname";

  return (
    <div>
      <h1 className="mb-4 text-lg font-bold">시스템 설정</h1>

      <div className="flex flex-col gap-4 md:max-w-md">
        <Card className="p-4">
          <p className="mb-1 text-sm font-bold">랭킹 이름 공개 방식</p>
          <p className="mb-3 text-xs text-[var(--color-ink-soft)]">
            전체 학생에게 일괄 적용됩니다.
          </p>
          <DisplayModeForm currentMode={currentMode} />
        </Card>

        <Card className="p-4">
          <p className="mb-3 text-sm font-bold">데이터 내보내기 (CSV)</p>
          <ExportPanel />
        </Card>

        <Card className="p-4" style={{ borderColor: "var(--color-rose)" }}>
          <p className="mb-1 text-sm font-bold" style={{ color: "var(--color-rose)" }}>위험 구역</p>
          <ClearTestDataForm />
        </Card>
      </div>
    </div>
  );
}
