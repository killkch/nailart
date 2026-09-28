import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/main/navbar/Navbar"; // 글로벌 Navbar
import { AuthProvider } from "@/contexts/AuthContext"; // 전역 인증 상태 관리

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NailArt-AI — AI 유튜브 썸네일 생성기",
  description: "채널 주제만 입력하면 AI가 클릭률을 극대화하는 유튜브 썸네일을 단 2초 만에 자동 생성합니다.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {/*
          AuthProvider로 전체 앱을 감쌉니다.
          이렇게 하면 자식 컴포넌트 어디서든 useAuth()를 호출해
          로그인 상태와 사용자 정보를 가져올 수 있습니다.
        */}
        <AuthProvider>
          {/* 모든 페이지에 공통으로 표시되는 Navbar (fixed position) */}
          <Navbar />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
