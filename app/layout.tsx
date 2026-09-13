import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3001";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: "QuizRand",
  title: {
    default: "QuizRand",
    template: "%s | QuizRand",
  },
  description: "QuizRand helps you learn faster with engaging quizzes, progress tracking, and a streamlined study experience.",
  keywords: ["quiz", "learning", "study", "education", "QuizRand"],
  authors: [{ name: "QuizRand" }],
  icons: {
    icon: "/qzr-icon.svg",
    shortcut: "/qzr-icon.svg",
    apple: "/qzr-icon.svg",
  },
  openGraph: {
    title: "QuizRand",
    description: "QuizRand helps you learn faster with engaging quizzes, progress tracking, and a streamlined study experience.",
    url: siteUrl,
    siteName: "QuizRand",
    images: [
      {
        url: "/qzr-icon.svg",
        width: 512,
        height: 512,
        alt: "QuizRand QZR icon",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "QuizRand",
    description: "QuizRand helps you learn faster with engaging quizzes, progress tracking, and a streamlined study experience.",
    images: ["/qzr-icon.svg"],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
