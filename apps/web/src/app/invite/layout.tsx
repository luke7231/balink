import type { Metadata } from "next";
import { noIndexMetadata } from "@/lib/seo";

export const metadata: Metadata = {
  ...noIndexMetadata,
  title: "초대",
};

export default function InviteLayout({ children }: { children: React.ReactNode }) {
  return children;
}
