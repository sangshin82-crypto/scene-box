import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Scene Box",
  description: "Next.js + Tailwind CSS starter",
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