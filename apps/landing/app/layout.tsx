import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { I18nProvider } from "@/lib/i18n";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Kura — Save links the way you think",
  description:
    "Kura is a browser extension that lets you save links with comments and tags, organize your reading list, and share instantly — 100% offline.",
  keywords: ["bookmarks", "reading list", "link saver", "browser extension", "tags"],
  openGraph: {
    title: "Kura — Save links the way you think",
    description:
      "Right-click any link. Add a comment, tags, and share instantly. Your reading list, organized — entirely offline.",
    type: "website",
    url: "https://yourdomain.com",
  },
  twitter: {
    card: "summary_large_image",
    title: "Kura — Save links the way you think",
    description: "Your reading list, organized — entirely offline.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <I18nProvider>{children}</I18nProvider>
      </body>
    </html>
  );
}
