import type { Metadata } from "next";
import { noIndexMetadata } from "@/lib/seo";

export const metadata: Metadata = {
  ...noIndexMetadata,
  title: "회원가입",
};

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return children;
}
