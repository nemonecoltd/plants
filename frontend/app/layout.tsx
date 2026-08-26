import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import BottomNav from "@/components/BottomNav";
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
const SITE_DESCRIPTION = "실내식물부터 정원식물까지, 정확한 학명·물주기·빛·내한성 정보로 찾아보는 식물도감 & 케어 가이드.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} | 식물도감 & 케어 가이드`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  alternates: { canonical: "/" },
  robots: { index: true, follow: true },
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
    title: `${SITE_NAME} | 식물도감 & 케어 가이드`,
    description: SITE_DESCRIPTION,
    images: [{ url: "/images/plants/hero.jpg", width: 960, height: 640, alt: SITE_NAME }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} | 식물도감 & 케어 가이드`,
    description: SITE_DESCRIPTION,
    images: ["/images/plants/hero.jpg"],
  },
};

// 아직 검색 기능이 없어 SearchAction은 넣지 않음(작동 안 하는 구조화데이터는 오히려 감점 요인).
// Organization은 msm/now와 동일한 네모네(모회사) 정보를 재사용.
const jsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    inLanguage: "ko-KR",
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
        <SiteHeader />
        {children}
        <SiteFooter />
        <BottomNav />
      </body>
    </html>
  );
}
