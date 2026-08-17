import { createClient } from "@/lib/supabase/server";
import type { Profile, RosterEntry } from "@/lib/database.types";
import { StudentsSearch } from "./StudentsSearch";

export default async function AdminStudentsPage() {
  const supabase = await createClient();

  const [{ data: roster }, { data: profiles }] = await Promise.all([
    supabase.from("roster").select("*").order("student_number") as unknown as Promise<{
      data: RosterEntry[] | null;
    }>,
    supabase.from("profiles").select("*").order("student_number") as unknown as Promise<{
      data: Profile[] | null;
    }>,
  ]);

  return (
    <div>
      <h1 className="mb-4 text-lg font-bold">학생 관리</h1>
      <StudentsSearch roster={roster ?? []} profiles={profiles ?? []} />
    </div>
  );
}
