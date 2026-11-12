import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { SiteNav } from "@/components/site-nav";
import { ProgressFailureNotice, ProgressProvider } from "@/features/progress/progress-context";
import { withBasePath } from "@/lib/base-path";
import "./globals.css";

export const metadata: Metadata = {
  title: "CEO アカデミー",
  description: "経営者に必要な13分野を、財務3表をものさしにして学ぶ学習アプリ",
  robots: { index: false, follow: false },
  icons: { icon: withBasePath("/icon.svg"), apple: withBasePath("/app-icon/180.png") },
  appleWebApp: { capable: true, title: "CEOアカデミー", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f3f5f1",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ja" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <ProgressProvider>
          <header className="flex items-baseline gap-8 px-4 pt-5 pb-2 md:px-9 md:pt-6">
            <Link href="/" className="text-lg font-bold tracking-wide text-ink">
              CEO アカデミー
            </Link>
            <SiteNav />
          </header>
          <ProgressFailureNotice />
          <div className="flex flex-1 flex-col pb-20 md:pb-10">{children}</div>
        </ProgressProvider>
      </body>
    </html>
  );
}
