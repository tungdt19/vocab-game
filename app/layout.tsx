import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({ subsets: ["latin", "vietnamese"] })

export const metadata: Metadata = {
  title: "Game Học Từ Vựng",
  description: "Trò chơi học từ vựng Oxford 3000",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0, interactive-widget=resizes-content",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="vi">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
