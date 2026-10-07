import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return <main className="flex justify-center px-6 py-12">
    {process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY
      ? <SignIn routing="path" path="/sign-in" signUpUrl="/sign-up" />
      : <p>現在ログインを利用できません。</p>}
  </main>;
}
