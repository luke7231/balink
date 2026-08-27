import type { Metadata } from "next";
import { NotificationHistoryRefresh } from "@/components/notification-history-refresh";
import { noIndexMetadata } from "@/lib/seo";

export const metadata: Metadata = {
  ...noIndexMetadata,
  title: "알림",
};

export default function NotificationsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <NotificationHistoryRefresh />
      {children}
    </>
  );
}
