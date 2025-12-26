import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/ThemeProvider";
import { WebApplicationJsonLd, OrganizationJsonLd } from "@/components/JsonLd";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://ai-detector.vercel.app';

export const metadata: Metadata = {
  title: {
    default: "AI Detector - AI 생성 이미지 판별",
    template: "%s | AI Detector",
  },
  description: "이미지가 AI로 생성되었는지 즉시 판별합니다. 딥페이크, Midjourney, DALL-E 등 AI 이미지를 95% 정확도로 탐지합니다. 파일 업로드 또는 URL 입력 지원.",
  keywords: [
    "AI 이미지 판별",
    "딥페이크 탐지",
    "AI 생성 이미지",
    "Midjourney 판별",
    "DALL-E 탐지",
    "가짜 이미지 확인",
    "AI detector",
    "fake image detection",
    "중고거래 사기 방지",
    "프로필 진위 확인",
  ],
  authors: [{ name: "AI Detector" }],
  creator: "AI Detector",
  publisher: "AI Detector",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(APP_URL),
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: APP_URL,
    siteName: "AI Detector",
    title: "AI Detector - AI 생성 이미지 판별",
    description: "이미지가 AI로 생성되었는지 즉시 판별합니다. 딥페이크, AI 이미지를 95% 정확도로 탐지합니다.",
    images: [
      {
        url: "/api/og",
        width: 1200,
        height: 630,
        alt: "AI Detector - AI 이미지 판별 서비스",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Detector - AI 생성 이미지 판별",
    description: "이미지가 AI로 생성되었는지 즉시 판별합니다. 딥페이크, AI 이미지를 95% 정확도로 탐지합니다.",
    images: ["/api/og"],
    creator: "@ai_detector",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: APP_URL,
    languages: {
      "ko-KR": APP_URL,
    },
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
    yandex: process.env.YANDEX_VERIFICATION,
    other: {
      "naver-site-verification": process.env.NAVER_SITE_VERIFICATION || "",
    },
  },
  category: "technology",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <WebApplicationJsonLd />
        <OrganizationJsonLd />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
