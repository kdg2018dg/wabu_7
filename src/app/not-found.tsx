import Link from "next/link";
import { Logo7 } from "@/components/Logo7";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <Logo7 size={30} />
      <div>
        <p className="text-lg font-bold">페이지를 찾을 수 없어요</p>
        <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
          주소가 바뀌었거나 삭제된 페이지일 수 있어요.
        </p>
      </div>
      <Link href="/" className="btn-primary px-5">
        홈으로 가기
      </Link>
    </main>
  );
}
