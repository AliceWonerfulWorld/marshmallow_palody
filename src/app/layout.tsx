import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { AuthProvider } from "@/components/auth-provider";
import { PublicDataProvider } from "@/components/public-data-provider";
import { Header } from "@/components/header";

export const metadata: Metadata = {
  title: "marshmallow_palody",
  description: "匿名で質問を送れる質問箱サービス",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  const authEnabled = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY);
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  const content = <><Header authEnabled={authEnabled} />{children}</>;
  return (
    <html lang="ja">
      <body>{authEnabled ? (
        <ClerkProvider signInUrl="/sign-in" signUpUrl="/sign-up" signInFallbackRedirectUrl="/inbox" signUpFallbackRedirectUrl="/inbox">
          {url ? <AuthProvider url={url}>{content}</AuthProvider> : content}
        </ClerkProvider>
      ) : url ? <PublicDataProvider url={url}>{content}</PublicDataProvider> : content}</body>
    </html>
  );
}
