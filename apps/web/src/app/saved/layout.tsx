import type { Metadata } from "next";
import { noIndexMetadata } from "@/lib/seo";

export const metadata: Metadata = {
  ...noIndexMetadata,
  title: "저장",
};

export default function SavedLayout({ children }: { children: React.ReactNode }) {
  return children;
}
