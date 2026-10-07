import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return <main className="auth-page flex min-w-0 flex-col items-center gap-6 px-4 py-8 sm:px-6 sm:py-12">
    <h1 className="text-2xl font-bold">あなたの質問箱を作ろう</h1>
    {process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY
      ? <SignUp appearance={{ elements: { rootBox: "w-full max-w-sm", cardBox: "w-full", card: "w-full min-w-0" } }} routing="path" path="/sign-up" signInUrl="/sign-in" />
      : <p>現在アカウント登録を利用できません。</p>}
  </main>;
}
