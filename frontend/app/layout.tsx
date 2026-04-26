import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });

export const metadata: Metadata = {
  title: "AI Insurance Policy Analyzer",
  description: "Simplify and analyze complex insurance policies with AI.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`h-full antialiased dark ${outfit.variable}`} data-scroll-behavior="smooth">
      <body className="min-h-full flex flex-col font-sans bg-zinc-950 text-zinc-200">{children}</body>
    </html>
  );
}
