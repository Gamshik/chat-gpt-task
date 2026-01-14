import { ubuntu } from "./fonts";

import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ChatGpt",
  description: "AI powered chat application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className={ubuntu.variable}>
      <body className={ubuntu.className}>{children}</body>
    </html>
  );
}
