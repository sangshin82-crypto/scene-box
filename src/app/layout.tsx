import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://scenebox.co.kr"),
  title: {
    default: "씬박스(SceneBox) | 촬영·무대·팝업 짐 보관 전문 B2B 서비스",
    template: "%s | 씬박스(SceneBox)",
  },
  description:
    "촬영 소품, 무대 설치물, 팝업 집기, 비정형 화물까지. 필요한 만큼, 필요한 기간만 보관하는 B2B 전문 보관 서비스. 파레트 1개(월 5만원)부터 그리드 단위까지, 입고 배차·보관·폐기 정산을 한 번에. 경기 용인 모현읍.",
  keywords: ["씬박스", "SceneBox", "촬영소품 보관", "무대 보관", "팝업 집기 보관", "비정형 화물 보관", "B2B 창고", "단기 보관", "용인 창고"],
  applicationName: "씬박스(SceneBox)",
  verification: {
    other: {
      "naver-site-verification": "79a4ae246503103350b8a2d6580181b62b440955",
    },
  },
  openGraph: {
    type: "website",
    siteName: "씬박스(SceneBox)",
    title: "씬박스(SceneBox) | 촬영·무대·팝업 짐 보관 전문 B2B 서비스",
    description:
      "버리자니 아깝고 두자니 둘 데가 없는 짐, 씬박스가 받아드립니다. 촬영·무대·팝업·비정형 화물 전문 보관. 필요한 만큼, 필요한 기간만.",
    url: "https://scenebox.co.kr",
    locale: "ko_KR",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-background text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}