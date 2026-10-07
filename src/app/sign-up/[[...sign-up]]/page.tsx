import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return <main className="flex justify-center px-6 py-12">
    {process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY
      ? <SignUp routing="path" path="/sign-up" signInUrl="/sign-in" />
      : <p>現在アカウント登録を利用できません。</p>}
  </main>;
}
