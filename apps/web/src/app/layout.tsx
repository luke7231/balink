import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AppShell } from "@/components/app-shell";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "발링크",
  description: "Ballet Career, Connected — 발레 강사 커리어 플랫폼",
  openGraph: {
    title: "발링크",
    description: "Ballet Career, Connected — The leading platform for ballet careers.",
    images: [{ url: "/brand/og.png", width: 1200, height: 630, alt: "balink" }],
    type: "website",
    siteName: "발링크",
  },
  twitter: {
    card: "summary_large_image",
    title: "발링크",
    description: "Ballet Career, Connected — The leading platform for ballet careers.",
    images: ["/brand/og.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
