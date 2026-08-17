import { requireProfile } from "@/lib/auth";
import { PageHeader } from "@/components/PageHeader";
import { TimetableClient } from "./TimetableClient";
import { TimetableOnboardingHint } from "./TimetableOnboardingHint";

export default async function TimetablePage() {
  const profile = await requireProfile();

  return (
    <div>
      <PageHeader title="내 시간표" subtitle="칸을 눌러 나만의 시간표로 자유롭게 바꿔보세요" compact />
      <div className="px-5 pb-6">
        <TimetableOnboardingHint />
        <TimetableClient userId={profile.id} />
      </div>
    </div>
  );
}
