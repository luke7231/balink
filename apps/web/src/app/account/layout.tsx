import type { Metadata } from "next";
import { noIndexMetadata } from "@/lib/seo";

export const metadata: Metadata = {
  ...noIndexMetadata,
  title: "계정",
};

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return children;
}
