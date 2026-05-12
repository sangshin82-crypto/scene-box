import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "씬박스(SceneBox) | B2B 소형 창고 및 마당 주차 매칭 플랫폼",
  description: "용인 모현읍 위치, 1.2평(1그리드) 월 12만 원. 파레트 상하차가 용이한 B2B 전문 창고 및 캠핑카/화물차 주차장 서비스.",
  verification: {
    other: {
      "naver-site-verification": "195e96f1e8af3b3e6fb171f165b83db2f00c0359",
    },
  },
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}