import type { Metadata, Viewport } from "next";
import { Noto_Sans_KR } from "next/font/google";
import "./globals.css";
import { SplashProvider } from "@/components/SplashProvider";
import { AppShell } from "@/components/AppShell";
import { NoticePopup } from "@/components/NoticePopup";

const notoSans = Noto_Sans_KR({
  variable: "--font-climb-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "베스트클라이밍",
  description: "베스트클라이밍 - 오늘의 완등자, 운동일지, 출석체크",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "베스트클라이밍",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#22c55e",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={notoSans.variable}>
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body className="min-h-screen bg-[var(--background)] text-[var(--foreground)] antialiased">
        <SplashProvider>
          <AppShell>{children}</AppShell>
          <NoticePopup />
        </SplashProvider>
      </body>
    </html>
  );
}
