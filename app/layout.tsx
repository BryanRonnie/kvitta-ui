import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "@/components/Providers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/**
 * SEO Metadata
 * Next.js automatically handles OpenGraph, Twitter cards, etc.
 */
export const metadata: Metadata = {
  title: {
    default: "Kvitta - Smart Receipt Processing",
    template: "%s | Kvitta",
  },
  description: "AI-powered receipt extraction and bill splitting using Nvidia OCR",
  keywords: ["receipt", "OCR", "bill splitting", "AI", "Nvidia"],
  authors: [{ name: "Kvitta Team" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://kvitta.app",
    title: "Kvitta - Smart Receipt Processing",
    description: "AI-powered receipt extraction and bill splitting",
    siteName: "Kvitta",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
