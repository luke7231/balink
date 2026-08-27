import type { Metadata } from "next";
import { noIndexMetadata } from "@/lib/seo";

export const metadata: Metadata = {
  ...noIndexMetadata,
  title: "로그인",
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
