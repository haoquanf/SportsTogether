import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { SetupBanner } from "@/components/setup-banner";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Rally: play more badminton, play better",
  description: "Find local badminton games and get AI feedback on your technique.",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={geistSans.variable}>
      <body className="min-h-screen">
        <SetupBanner />
        {children}
      </body>
    </html>
  );
}
