import type { Metadata } from "next";
import { Fraunces, DM_Sans } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { SkeletonTheme } from "react-loading-skeleton";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["400", "600"],
  style: ["normal", "italic"],
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Traveloop — Your journey, beautifully planned",
  description: "Plan trips, build itineraries, track budgets, and share adventures.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en" className={`${fraunces.variable} ${dmSans.variable} h-full antialiased`}>
        <body className="min-h-full flex flex-col" style={{ fontFamily: "var(--font-dm-sans, DM Sans, sans-serif)" }}>
          <SkeletonTheme baseColor="#F0EBE3" highlightColor="#FAF6F0">
            {children}
          </SkeletonTheme>
        </body>
      </html>
    </ClerkProvider>
  );
}
