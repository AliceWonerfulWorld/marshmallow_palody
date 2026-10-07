import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return <main className="auth-page flex min-w-0 justify-center px-4 py-8 sm:px-6 sm:py-12">
    {process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY
      ? <SignIn appearance={{ elements: { rootBox: "w-full max-w-sm", cardBox: "w-full", card: "w-full min-w-0" } }} routing="path" path="/sign-in" signUpUrl="/sign-up" />
      : <p>現在ログインを利用できません。</p>}
  </main>;
}
