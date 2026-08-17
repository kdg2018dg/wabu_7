import { requireProfile } from "@/lib/auth";
import { PageHeader } from "@/components/PageHeader";
import { RankingsClient } from "./RankingsClient";

export default async function RankingsPage() {
  const profile = await requireProfile();

  return (
    <div>
      <PageHeader title="이번 주 공부시간 TOP" compact />
      <div className="px-5 pb-6">
        <RankingsClient userId={profile.id} />
      </div>
    </div>
  );
}
