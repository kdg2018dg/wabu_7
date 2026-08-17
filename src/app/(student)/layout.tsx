import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";
import { BottomNav } from "@/components/BottomNav";
import { DesktopNav } from "@/components/DesktopNav";

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();

  if (!profile) redirect("/login");
  // 관리자도 일반 화면(캘린더/시간표/공부 인증 등)을 그대로 쓸 수 있다.
  // 관리자 전용 기능(역할 변경, 대시보드 등)은 /admin 에서 requireAdmin() 으로 별도 보호한다.

  return (
    <div className="flex min-h-screen flex-col">
      <DesktopNav name={profile.name} role={profile.role} />
      <div className="mx-auto w-full max-w-2xl flex-1 pb-24 md:max-w-3xl md:pb-12">{children}</div>
      <BottomNav />
    </div>
  );
}
