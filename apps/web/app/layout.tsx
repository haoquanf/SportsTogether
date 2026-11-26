import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SetupBanner } from "@/components/setup-banner";
import { ClickTracker } from "@/components/click-tracker";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ZeniSports: play more, play better",
  description: "AI coaching, lessons and local groups for badminton, ballroom dance and more.",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={geistSans.variable}>
      <body className="min-h-screen">
        <SetupBanner />
        {children}
        <ClickTracker />
        <Analytics />
      </body>
    </html>
  );
}
