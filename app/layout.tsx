import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  viewportFit: "cover",
  themeColor: "#1C1C1E",
}

export const metadata: Metadata = {
  metadataBase: new URL("https://for-youth.site"),
  title: {
    template: "%s | For Youth",
    default: "For Youth — 청년 취업·이직 준비 플랫폼",
  },
  description:
    "이직과 취업을 준비하는 청년을 위한 정부 지원 프로그램 탐색과 지원 현황 관리 서비스",
  icons: {
    icon: "/icons/flame.svg",
  },
  openGraph: {
    siteName: "For Youth",
    locale: "ko_KR",
    type: "website",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "For Youth — 청년 취업·이직 준비 플랫폼",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/opengraph-image"],
  },
  alternates: {
    canonical: "https://for-youth.site",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      name: "For Youth",
      url: "https://for-youth.site",
      description:
        "이직과 취업을 준비하는 청년을 위한 정부 지원 프로그램 탐색과 지원 현황 관리 서비스",
      inLanguage: "ko",
    },
    {
      "@type": "Organization",
      name: "For Youth",
      url: "https://for-youth.site",
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <Providers>{children}</Providers>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </body>
    </html>
  );
}
