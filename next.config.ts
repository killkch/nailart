import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,

  images: {
    remotePatterns: [
      {
        // 구글 OAuth 로그인 후 프로필 아바타 이미지 도메인
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/**",
      },
    ],
  },

  // YouTube iframe 자동재생 허용을 위한 HTTP 헤더 설정
  async headers() {
    return [
      {
        // auth 페이지에만 YouTube 허용 헤더 적용
        source: "/auth",
        headers: [
          {
            // Permissions-Policy: autoplay를 허용해야 iframe 내 YouTube 자동재생 가능
            key: "Permissions-Policy",
            value: "autoplay=*, camera=(), microphone=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
