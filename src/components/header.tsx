import { Show, UserButton } from "@clerk/nextjs";
import { OwnBoxLink } from "./own-box-link";
import Link from "next/link";

export function Header({ authEnabled }: { authEnabled: boolean }) {
  const login = <Link href="/sign-in" prefetch={false}>ログイン</Link>;
  return (
    <header className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-200 px-6 py-4">
      <Link href="/">marshmallow_palody</Link>
      <nav aria-label="メインメニュー" className="flex flex-wrap items-center gap-4">
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
