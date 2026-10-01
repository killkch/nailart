import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Shield, Lock, Eye, FileText, Database, Server, CheckCircle2 } from 'lucide-react';

/**
 * app/privacy/page.tsx
 *
 * NailArt-AI 개인정보처리방침 (Privacy Policy) 페이지
 * ─────────────────────────────────────────────────────────────
 * [디자인 및 레이아웃]
 * 1. 기존 대시보드와 동일한 단일 그리드 타일 다크 배경 (#181818)
 * 2. 상단 독립 플로팅 알약 로고 버튼 및 뒤로가기 링크
 * 3. 중앙 글래스모피즘 본문 카드 (bg-[#1E2023]/90, border-white/10)
 * 4. 한국어 법률 및 프라이버시 가이드라인을 준수한 상세 조항 구성
 * 5. 약관 페이지(/terms)와 상호 연동 네비게이션 제공
 */

// ── 단일 그리드 타일 배경 스타일 ─────────────────────────────
const GRID_TILE_STYLE: React.CSSProperties = {
  backgroundColor: '#181818',
  backgroundImage: `
    linear-gradient(to right, rgba(255, 255, 255, 0.04) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(255, 255, 255, 0.04) 1px, transparent 1px)
  `,
  backgroundSize: '40px 40px',
  backgroundPosition: '0 0',
};

export default function PrivacyPage() {
  return (
    <div
      className="min-h-screen relative flex flex-col justify-between overflow-x-hidden text-gray-200"
      style={GRID_TILE_STYLE}
    >
      {/* ── 상단 독립형 플로팅 헤더 ── */}
      <header className="fixed top-0 left-0 right-0 z-50 pointer-events-none p-4 sm:p-5 md:p-7">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          {/* 좌측 로고 버튼 */}
          <div className="pointer-events-auto">
            <Link
              href="/"
              className="
                group flex items-center gap-2.5 sm:gap-3 px-3.5 sm:px-4 py-2 rounded-full
                bg-[#1E2023]/80 hover:bg-[#2A2B2F]
                backdrop-blur-xl border border-white/10 hover:border-white/20
                shadow-[0_8px_32px_rgba(0,0,0,0.36)]
                transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]
                no-underline
              "
              aria-label="홈으로 이동"
            >
              <div className="relative w-6 h-6 sm:w-7 sm:h-7 rounded-full overflow-hidden shadow-inner ring-1 ring-white/20">
                <Image
                  src="/nailart01.png"
                  alt="NailArt-AI 로고"
                  width={28}
                  height={28}
                  className="object-cover w-full h-full"
                  priority
                />
              </div>
              <span className="text-sm md:text-base font-bold text-white tracking-tight flex items-center gap-1">
                NailArt
                <span className="bg-gradient-to-r from-[#A78BFA] to-[#38BDF8] bg-clip-text text-transparent font-extrabold">
                  -AI
                </span>
              </span>
            </Link>
          </div>

          {/* 우측 바로가기 알약 버튼 */}
          <div className="pointer-events-auto flex items-center gap-2">
            <Link
              href="/terms"
              className="
                flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full
                bg-[#1E2023]/80 hover:bg-[#2A2B2F]
                backdrop-blur-xl border border-white/10 hover:border-white/20
                text-xs sm:text-sm font-medium text-gray-300 hover:text-white
                shadow-[0_8px_32px_rgba(0,0,0,0.36)]
                transition-all duration-200 no-underline
              "
            >
              <FileText className="w-3.5 h-3.5 text-purple-400" />
              <span>이용약관</span>
            </Link>

            <Link
              href="/"
              className="
                flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full
                bg-white/5 hover:bg-white/10
                backdrop-blur-xl border border-white/10 hover:border-white/20
                text-xs sm:text-sm font-medium text-gray-300 hover:text-white
                shadow-[0_8px_32px_rgba(0,0,0,0.36)]
                transition-all duration-200 no-underline
              "
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>홈으로</span>
            </Link>
          </div>
        </div>
      </header>

      {/* ── 메인 컨텐츠 영역 ── */}
      <main className="flex-1 flex flex-col items-center justify-start px-4 sm:px-6 md:px-8 pt-28 pb-20 w-full max-w-4xl mx-auto z-10">
        
        {/* 상단 타이틀 섹션 */}
        <div className="text-center mb-10 animate-in fade-in-50 duration-700">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs sm:text-sm font-medium mb-3 backdrop-blur-md">
            <Shield className="w-4 h-4 text-[#A78BFA]" />
            <span>투명하고 안전한 개인정보 보호</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight mb-3">
            개인정보
            <span className="bg-gradient-to-r from-[#A78BFA] via-[#C084FC] to-[#38BDF8] bg-clip-text text-transparent">
              처리방침
            </span>
          </h1>

          <p className="text-xs sm:text-sm text-gray-400">
            시행일자: 2026년 10월 1일 | 최종 변경일자: 2026년 10월 2일
          </p>
        </div>

        {/* ── 본문 글래스모피즘 아티클 카드 ── */}
        <div className="w-full rounded-3xl bg-[#1E2023]/90 backdrop-blur-2xl border border-white/10 p-6 sm:p-10 md:p-12 shadow-[0_24px_64px_rgba(0,0,0,0.7)] space-y-10">
          
          {/* 서문 요약 안내 박스 */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white/[0.03] border border-white/5 flex items-start gap-3.5">
            <Lock className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm text-gray-300 leading-relaxed space-y-1">
              <p className="font-bold text-white">NailArt-AI는 이용자의 개인정보를 소중하게 보호합니다.</p>
              <p>
                본 방침은 주식회사 또는 운영주체(이하 &quot;서비스&quot; 또는 &quot;NailArt-AI&quot;)가 제공하는
                AI 썸네일 생성 서비스와 관련하여 이용자의 개인정보가 어떠한 용도와 방식으로 수집, 이용되며
                어떠한 보안 조치를 통해 안전하게 관리되는지 상세히 설명합니다.
              </p>
            </div>
          </div>

          {/* 제 1 조: 수집하는 개인정보 항목 */}
          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2 border-b border-white/10 pb-2">
              <span className="w-2 h-2 rounded-full bg-purple-400" />
              제 1 조 (수집하는 개인정보 항목 및 수집 방법)
            </h2>
            <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
              서비스는 원활한 회원가입, 썸네일 생성 서비스 제공, 결제 및 고객 지원을 위해 다음과 같은 최소한의 개인정보를 수집합니다.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-1.5">
                <span className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> 필수 수집 항목
                </span>
                <ul className="text-xs text-gray-400 space-y-1 list-disc list-inside">
                  <li>이메일 주소 (계정 식별 및 알림)</li>
                  <li>이름 또는 닉네임 (프로필 표시용)</li>
                  <li>소셜 로그인 시 제공되는 고유 식별자(ID)</li>
                  <li>프로필 이미지 URL (선택 시)</li>
                </ul>
              </div>
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-1.5">
                <span className="text-xs font-bold text-sky-300 flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5" /> 서비스 이용 과정에서 생성되는 정보
                </span>
                <ul className="text-xs text-gray-400 space-y-1 list-disc list-inside">
                  <li>생성 요청 프롬프트 텍스트</li>
                  <li>사용자가 직접 업로드한 참조 이미지</li>
                  <li>생성된 썸네일 결과물 이미지 및 저장 경로</li>
                  <li>크레딧 잔여량 및 결제 거래 식별자</li>
                </ul>
              </div>
            </div>
          </section>

          {/* 제 2 조: 개인정보의 수집 및 이용 목적 */}
          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2 border-b border-white/10 pb-2">
              <span className="w-2 h-2 rounded-full bg-purple-400" />
              제 2 조 (개인정보의 수집 및 이용 목적)
            </h2>
            <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
              수집된 개인정보는 다음의 목적 이외의 용도로는 사용되지 않으며, 이용 목적이 변경될 시에는 사전 동의를 구합니다.
            </p>
            <ul className="text-xs sm:text-sm text-gray-400 space-y-1.5 list-disc list-inside pl-1">
              <li><strong className="text-gray-200">서비스 제공 및 이행:</strong> 고화질 유튜브 썸네일 AI 생성 및 내 갤러리 저장, 다운로드 기능 제공</li>
              <li><strong className="text-gray-200">회원 관리:</strong> 가입 의사 확인, 본인 인증, 부정 이용 방지 및 계정 탈퇴 처리</li>
              <li><strong className="text-gray-200">결제 및 요금 정산:</strong> 유료 플랜(Pro, Ultra) 구독 처리, 크레딧 충전, 인보이스 및 영수증 발급</li>
              <li><strong className="text-gray-200">서비스 품질 개선:</strong> 오류 감지, AI 렌더링 성능 향상 및 신규 추천 기능 개발</li>
            </ul>
          </section>

          {/* 제 3 조: 결제 정보의 안전한 위탁 (Polar MoR) */}
          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2 border-b border-white/10 pb-2">
              <span className="w-2 h-2 rounded-full bg-purple-400" />
              제 3 조 (결제 정보의 안전한 처리 및 위탁)
            </h2>
            <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-500/20 text-xs sm:text-sm text-gray-300 space-y-2">
              <p className="font-semibold text-purple-200 flex items-center gap-1.5">
                <Server className="w-4 h-4 text-purple-400" />
                PCI-DSS 준수 글로벌 결제 대행 (Polar.sh)
              </p>
              <p className="text-xs text-gray-400 leading-relaxed">
                NailArt-AI는 고객의 신용카드 번호나 CVC 번호 등 민감한 결제 정보를 서비스 서버에 절대 직접 저장하지 않습니다.
                모든 결제 처리는 공식 글로벌 정산 대행사(Merchant of Record)인 <strong className="text-white">Polar.sh</strong>를 통해
                글로벌 보안 표준(PCI-DSS 레벨 1)에 따라 안전하게 암호화 처리됩니다.
              </p>
            </div>
          </section>

          {/* 제 4 조: 개인정보의 보유 및 파기 절차 */}
          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2 border-b border-white/10 pb-2">
              <span className="w-2 h-2 rounded-full bg-purple-400" />
              제 4 조 (개인정보의 보유 및 파기 절차)
            </h2>
            <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
              이용자의 개인정보는 원칙적으로 수집 및 이용 목적이 달성되면 지체 없이 파기합니다.
              단, 관계 법령(전자상거래 등에서의 소비자보호에 관한 법률 등)의 규정에 의하여 보존할 필요가 있는 경우 일정 기간 보관합니다:
            </p>
            <ul className="text-xs sm:text-sm text-gray-400 space-y-1 list-disc list-inside pl-1">
              <li>계약 또는 청약철회 등에 관한 기록: 5년</li>
              <li>대금결제 및 재화 등의 공급에 관한 기록: 5년</li>
              <li>소비자의 불만 또는 분쟁처리에 관한 기록: 3년</li>
              <li>웹사이트 방문 및 접속 로그 기록: 3개월</li>
            </ul>
          </section>

          {/* 제 5 조: 이용자의 권리와 행사 방법 */}
          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2 border-b border-white/10 pb-2">
              <span className="w-2 h-2 rounded-full bg-purple-400" />
              제 5 조 (이용자의 권리와 행사 방법)
            </h2>
            <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
              이용자는 언제든지 등록되어 있는 본인의 개인정보를 조회하거나 수정할 수 있으며, 서비스 탈퇴 및 정보 삭제를 요구할 수 있습니다.
              대시보드 내 프로필 관리 및 고객 지원 센터를 통해 즉시 처리 가능합니다.
            </p>
          </section>

          {/* 제 6 조: 개인정보 보호책임자 및 문의처 */}
          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2 border-b border-white/10 pb-2">
              <span className="w-2 h-2 rounded-full bg-purple-400" />
              제 6 조 (개인정보 보호책임자 및 문의처)
            </h2>
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 text-xs sm:text-sm text-gray-300 space-y-1">
              <p><strong className="text-white">책임 부서:</strong> NailArt-AI 정보보호팀</p>
              <p><strong className="text-white">문의 이메일:</strong> support@nailart-ai.com</p>
              <p className="text-xs text-gray-400 pt-1">
                개인정보 처리에 관한 문의 사항이나 불만 처리, 피해 구제 등은 위 문의처를 통해 신속하게 답변해 드립니다.
              </p>
            </div>
          </section>

        </div>
      </main>

      {/* ── 하단 미니멀 푸터 ── */}
      <footer className="w-full py-8 text-center text-xs text-gray-500 border-t border-white/[0.05] z-10 space-y-2">
        <div className="flex items-center justify-center gap-4">
          <Link href="/terms" className="hover:text-gray-300 transition underline underline-offset-4">
            서비스 이용약관
          </Link>
          <span>·</span>
          <Link href="/privacy" className="text-purple-400 hover:text-purple-300 font-semibold transition underline underline-offset-4">
            개인정보처리방침
          </Link>
          <span>·</span>
          <Link href="/" className="hover:text-gray-300 transition underline underline-offset-4">
            홈
          </Link>
        </div>
        <p>© 2026 NailArt-AI. All rights reserved.</p>
      </footer>
    </div>
  );
}
