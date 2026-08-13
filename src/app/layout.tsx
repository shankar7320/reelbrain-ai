import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "ReelBrain AI — Smart Saved Reels Manager",
  description: "AI-powered tool to organize, categorize, and analyze your Instagram saved reels with voice guidance.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-bg text-slate-200 antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
