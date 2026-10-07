import { Show, UserButton } from "@clerk/nextjs";
import Link from "next/link";

export function Header({ authEnabled }: { authEnabled: boolean }) {
  const login = <Link href="/sign-in" prefetch={false}>ログイン</Link>;
  return (
    <header className="flex items-center justify-between border-b border-stone-200 px-6 py-4">
      <Link href="/">marshmallow_palody</Link>
      <nav aria-label="メインメニュー" className="flex items-center gap-4">
        {authEnabled ? <>
          <Show when="signed-out">{login}</Show>
          <Show when="signed-in">
            <Link href="/inbox" prefetch={false}>受信箱</Link>
            <Link href="/settings" prefetch={false}>設定</Link>
            <UserButton />
          </Show>
        </> : login}
      </nav>
    </header>
  );
}
