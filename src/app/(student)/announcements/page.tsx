import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/Card";
import type { Announcement } from "@/lib/database.types";
import { NewAnnouncementForm } from "./NewAnnouncementForm";
import { AnnouncementCard } from "./AnnouncementCard";

const LIMIT = 50;

export default async function AnnouncementsPage() {
  const supabase = await createClient();
  const { data } = (await supabase
    .from("announcements")
    .select("*, updated_by_profile:profiles!announcements_updated_by_fkey(name)")
    .order("is_important", { ascending: false })
    .order("published_at", { ascending: false })
    .limit(LIMIT)) as { data: (Announcement & { updated_by_profile: { name: string } | null })[] | null };

  const announcements = data ?? [];

  return (
    <div>
      <PageHeader title="공지사항" compact />
      <div className="flex flex-col gap-3 px-5 pb-6">
        <NewAnnouncementForm />

        {announcements.length === 0 && (
          <Card className="p-6 text-center text-sm text-[var(--color-ink-soft)]">
            아직 공지사항이 없어요.
          </Card>
        )}
        {announcements.map((a) => (
          <AnnouncementCard key={a.id} announcement={a} />
        ))}
        {announcements.length === LIMIT && (
          <p className="px-1 text-center text-xs text-[var(--color-ink-soft)]">
            최근 {LIMIT}건까지만 표시돼요.
          </p>
        )}
      </div>
    </div>
  );
}
