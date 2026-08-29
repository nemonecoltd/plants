import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import { AuthProvider } from "@/components/AuthProvider";
import BottomNav from "@/components/BottomNav";
import NaverAnalytics from "@/components/NaverAnalytics";
import { SavedProvider } from "@/components/SavedProvider";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_URL = "https://plants.nemoneai.com";
const SITE_NAME = "NEMONE PLANTS";
// AI 사진 진단 출시(2026-08-30)로 "찾아보는 도감"에서 "내 식물을 같이 들여다보는 서비스"로
// 성격이 다시 확장돼, 검색 유입의 핵심을 진단(증상 검색)으로 옮겨 설명문을 갱신.
const SITE_DESCRIPTION =
  "잎이 노랗게 변했나요? 사진 한 장으로 어떤 식물인지, 지금 상태가 어떤지 AI가 진단해 드려요. 진단 기록은 마이가든에 저장되고, 식물도감에서 물주기·빛·내한성까지 확인할 수 있습니다.";
// "식물집사"는 실제 검색량이 있는 표현이라 유지하되, 차별점인 AI 진단을 앞에 둔다
const SITE_TITLE = `${SITE_NAME} | AI 식물 진단 & 식물집사 케어 가이드`;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: [
    "식물도감", "식물집사", "식물 키우기", "실내식물", "물주기",
    "반려식물", "가드닝", "개화시기", "파종시기", "식물 이름 찾기",
    // 진단 기능으로 새로 노릴 검색어 — 증상형 롱테일이 실제 유입의 핵심
    "식물 사진 진단", "AI 식물 진단", "식물 잎 노랗게", "식물 병 진단", "화분 식물 상태",
  ],
  alternates: { canonical: "/" },
  robots: { index: true, follow: true },
  verification: {
    google: "eHAc5WBdeiR9-l5T2HvCw1v4XTdjKghnA3JCCSz-YAk",
    other: { "naver-site-verification": "07b17af7644b14ef24ad23f62e9cdac52803007b" },
  },
  icons: {
    icon: [
      { url: "/favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-48.png", sizes: "48x48", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    type: "website",
    locale: "ko_KR",
    siteName: SITE_NAME,
    url: SITE_URL,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [{ url: "/images/plants/hero.jpg", width: 960, height: 640, alt: SITE_NAME }],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: ["/images/plants/hero.jpg"],
  },
};

// Organization은 msm/now와 동일한 네모네(모회사) 정보를 재사용.
const jsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    inLanguage: "ko-KR",
    // 검색(/plants?q=)이 실제로 동작하게 된 뒤 추가 — 작동하지 않는 구조화데이터는 감점 요인이라
    // 기능이 붙기 전까지는 일부러 비워뒀었음
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: `${SITE_URL}/plants?q={search_term_string}` },
      "query-input": "required name=search_term_string",
    },
  },
  {
    // 단순 문서 사이트가 아니라 "저장하고 알림받으며 키우는" 도구임을 검색엔진에 명시(마이가든 출시)
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: SITE_NAME,
    url: SITE_URL,
    applicationCategory: "LifestyleApplication",
    operatingSystem: "Web",
    inLanguage: "ko-KR",
    description:
      "식물도감에서 찾은 식물과 가드닝팁을 마이가든에 저장하고, 개화·파종 시기에 맞춰 알림을 받아보는 식물 관리 서비스.",
    featureList: [
      "식물 학명·물주기·빛·내한성 정보 조회",
      "이름으로 식물 검색",
      "월별 개화 식물 추천",
      "마이가든에 식물·가드닝팁 저장",
      "저장한 식물의 개화·파종 시기 알림",
    ],
    offers: { "@type": "Offer", price: "0", priceCurrency: "KRW" },
  },
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "네모네",
    url: SITE_URL,
    email: "contact@nemoneai.com",
    address: {
      "@type": "PostalAddress",
      addressLocality: "제주도 한경면 낙천리 1235",
      addressCountry: "KR",
    },
  },
];

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        {/* next/script는 애드센스 로더와 충돌 이력이 있어(다른 네모네 서비스에서 확인됨)
            순수 <script> 태그로 직접 삽입 */}
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4274957638983041"
          crossOrigin="anonymous"
        />
      </head>
      <body className="min-h-full flex flex-col pb-14 sm:pb-0">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />

        {/* Google tag (gtag.js) */}
        <Script src="https://www.googletagmanager.com/gtag/js?id=G-7DK36J8F0Z" strategy="afterInteractive" />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-7DK36J8F0Z');
          `}
        </Script>

        <AuthProvider>
          <SavedProvider>
            <SiteHeader />
            {children}
            <SiteFooter />
            <BottomNav />
          </SavedProvider>
        </AuthProvider>

        <NaverAnalytics />
      </body>
    </html>
  );
}
