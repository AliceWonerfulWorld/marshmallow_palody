import { Show, UserButton } from "@clerk/nextjs";
import { OwnBoxLink } from "./own-box-link";
import Link from "next/link";

export function Header({ authEnabled }: { authEnabled: boolean }) {
  const login = <Link href="/sign-in" prefetch={false}>ログイン</Link>;
  return (
    <header className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-200 bg-white px-4 py-3 sm:px-6 sm:py-4">
      <Link href="/" className="min-w-0 font-semibold text-purple-900">marshmallow_palody</Link>
      <nav aria-label="メインメニュー" className="flex min-w-0 flex-wrap items-center gap-3">
        {authEnabled ? <>
          <Show when="signed-out">{login}</Show>
          <Show when="signed-in">
            {process.env.NEXT_PUBLIC_CONVEX_URL && <OwnBoxLink />}
            <Link href="/inbox" prefetch={false}>受信箱</Link>
            <Link href="/settings" prefetch={false}>設定</Link>
            <UserButton />
          </Show>
        </> : login}
      </nav>
    </header>
  );
}
