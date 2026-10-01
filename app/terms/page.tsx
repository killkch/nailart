import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, FileText, CheckCircle2, AlertTriangle, Scale, Coins, ShieldCheck, Sparkles } from 'lucide-react';

/**
 * app/terms/page.tsx
 *
 * NailArt-AI 서비스 이용약관 (Terms of Service) 페이지
 * ─────────────────────────────────────────────────────────────
 * [디자인 및 레이아웃]
 * 1. 기존 대시보드와 동일한 단일 그리드 타일 다크 배경 (#181818)
 * 2. 상단 독립 플로팅 알약 로고 버튼 및 뒤로가기 링크
 * 3. 중앙 글래스모피즘 본문 카드 (bg-[#1E2023]/90, border-white/10)
 * 4. 한국 전자상거래법 및 AI 생성물 저작권 표준을 준수한 상세 이용약관
 * 5. 개인정보처리방침(/privacy)과 상호 연동 네비게이션 제공
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

export default function TermsPage() {
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
              href="/privacy"
              className="
                flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full
                bg-[#1E2023]/80 hover:bg-[#2A2B2F]
                backdrop-blur-xl border border-white/10 hover:border-white/20
                text-xs sm:text-sm font-medium text-gray-300 hover:text-white
                shadow-[0_8px_32px_rgba(0,0,0,0.36)]
                transition-all duration-200 no-underline
              "
            >
              <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
              <span>개인정보방침</span>
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
            <Scale className="w-4 h-4 text-[#A78BFA]" />
            <span>상호 신뢰를 위한 약관</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight mb-3">
            서비스
            <span className="bg-gradient-to-r from-[#A78BFA] via-[#C084FC] to-[#38BDF8] bg-clip-text text-transparent">
              이용약관
            </span>
          </h1>

          <p className="text-xs sm:text-sm text-gray-400">
            시행일자: 2026년 10월 1일 | 최종 개정일자: 2026년 10월 2일
          </p>
        </div>

        {/* ── 본문 글래스모피즘 아티클 카드 ── */}
        <div className="w-full rounded-3xl bg-[#1E2023]/90 backdrop-blur-2xl border border-white/10 p-6 sm:p-10 md:p-12 shadow-[0_24px_64px_rgba(0,0,0,0.7)] space-y-10">
          
          {/* 서문 박스 */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white/[0.03] border border-white/5 flex items-start gap-3.5">
            <FileText className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm text-gray-300 leading-relaxed space-y-1">
              <p className="font-bold text-white">NailArt-AI 서비스를 이용해 주셔서 감사합니다.</p>
              <p>
                본 약관은 이용자가 NailArt-AI가 제공하는 인공지능 유튜브 썸네일 생성 및 관련 제반 서비스(이하 &quot;서비스&quot;)를
                이용함에 있어 회사와 이용자 간의 권리, 의무 및 책임 사항, 서비스 이용 조건 등을 규정함을 목적으로 합니다.
              </p>
            </div>
          </div>

          {/* 제 1 조: 용어의 정의 */}
          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2 border-b border-white/10 pb-2">
              <span className="w-2 h-2 rounded-full bg-purple-400" />
              제 1 조 (용어의 정의)
            </h2>
            <ul className="text-xs sm:text-sm text-gray-400 space-y-2 list-disc list-inside pl-1">
              <li><strong className="text-gray-200">&quot;서비스&quot;</strong>란 회사가 제공하는 AI 썸네일 생성 엔진, 갤러리 보관함 및 결제 관리를 포함한 웹 플랫폼 일체를 말합니다.</li>
              <li><strong className="text-gray-200">&quot;이용자&quot;</strong>란 본 약관에 동의하고 회사가 제공하는 서비스를 이용하는 회원 및 비회원을 말합니다.</li>
              <li><strong className="text-gray-200">&quot;크레딧(Credits)&quot;</strong>이란 서비스 내에서 AI 썸네일 생성을 1회 수행하기 위해 소모되는 가상 재화를 의미합니다.</li>
              <li><strong className="text-gray-200">&quot;유료 플랜(Pro, Ultra)&quot;</strong>이란 정기 구독 또는 일회성 결제를 통해 추가 크레딧과 부가 혜택을 제공받는 요금제를 말합니다.</li>
            </ul>
          </section>

          {/* 제 2 조: 약관의 효력 및 변경 */}
          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2 border-b border-white/10 pb-2">
              <span className="w-2 h-2 rounded-full bg-purple-400" />
              제 2 조 (약관의 효력 및 개정)
            </h2>
            <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
              본 약관은 서비스 화면에 게시하거나 전자우편 등의 방법으로 회원에게 공지함으로써 효력이 발생합니다.
              회사는 합리적인 사유가 발생할 경우 관련 법령을 위배하지 않는 범위 내에서 본 약관을 개정할 수 있으며,
              개정 약관은 효력 발생일 7일 전부터 웹사이트에 사전 공지합니다.
            </p>
          </section>

          {/* 제 3 조: 크레딧 차감 및 환불 규정 */}
          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2 border-b border-white/10 pb-2">
              <span className="w-2 h-2 rounded-full bg-purple-400" />
              제 3 조 (크레딧 정책 및 에러 보상 환불)
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-1.5">
                <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                  <Coins className="w-3.5 h-3.5" /> 1회 생성 = 1 크레딧 원칙
                </span>
                <p className="text-xs text-gray-400 leading-relaxed">
                  사용자가 프롬프트를 전송하여 썸네일 생성을 시작할 때 1 크레딧이 선 차감됩니다.
                  잔여 크레딧이 1개 미만인 경우 추가 충전 후 서비스를 이용할 수 있습니다.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-1.5">
                <span className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" /> 실패 시 100% 자동 반환 보장
                </span>
                <p className="text-xs text-gray-400 leading-relaxed">
                  AI 렌더링 오류, 서버 네트워크 지연, 스토리지 업로드 실패 등 회사의 시스템 상의 이유로 정상 썸네일이 생성되지 못한 경우,
                  차감된 1 크레딧은 시스템에 의해 이용자의 계정으로 즉시 원상 복구(환불)됩니다.
                </p>
              </div>
            </div>
          </section>

          {/* 제 4 조: 구독 및 결제 취소/해지 (Polar MoR) */}
          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2 border-b border-white/10 pb-2">
              <span className="w-2 h-2 rounded-full bg-purple-400" />
              제 4 조 (구독 결제 및 자율 해지 권리)
            </h2>
            <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
              모든 요금제 결제는 공식 결제 정산 대행사(Merchant of Record)인 Polar.sh를 통해 안전하게 이루어집니다.
            </p>
            <ul className="text-xs sm:text-sm text-gray-400 space-y-1.5 list-disc list-inside pl-1">
              <li><strong className="text-gray-200">언제든 자율 해지(Self-service Cancel):</strong> 이용자는 대시보드 내 [구독 관리 (포털)] 링크를 통해 언제든지 고객 지원 문의 없이 직접 구독을 취소 또는 재개(Uncancel)할 수 있습니다.</li>
              <li><strong className="text-gray-200">구독 취소 시 효력:</strong> 구독을 취소하더라도 이미 결제된 해당 결제 주기 만료일까지는 기존 혜택 및 충전된 크레딧이 유지됩니다.</li>
              <li><strong className="text-gray-200">다운그레이드 시 크레딧 보존:</strong> 플랜을 다운그레이드하더라도 기존에 충전된 잔여 크레딧은 차감되거나 소멸되지 않고 그대로 보존됩니다.</li>
            </ul>
          </section>

          {/* 제 5 조: AI 썸네일 저작권 및 지식재산권 귀속 */}
          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2 border-b border-white/10 pb-2">
              <span className="w-2 h-2 rounded-full bg-purple-400" />
              제 5 조 (저작권 및 상업적 이용 권리)
            </h2>
            <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/20 text-xs sm:text-sm text-gray-300 space-y-1.5">
              <p className="font-bold text-emerald-300 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                생성된 썸네일의 권리는 전적으로 크리에이터에게 귀속됩니다
              </p>
              <p className="text-xs text-gray-400 leading-relaxed">
                이용자가 본 서비스를 통해 생성한 16:9 유튜브 썸네일 이미지의 상업적 이용 및 게재 권한은 이용자 본인에게 있습니다.
                이용자는 생성된 썸네일을 유튜브, SNS, 블로그 등 모든 온·오프라인 매체에 자유롭게 상업적으로 사용할 수 있습니다.
              </p>
            </div>
          </section>

          {/* 제 6 조: 이용자의 의무 및 금지 행위 */}
          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2 border-b border-white/10 pb-2">
              <span className="w-2 h-2 rounded-full bg-purple-400" />
              제 6 조 (이용자의 의무 및 금지 행위)
            </h2>
            <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
              이용자는 서비스 이용 시 다음 각 호의 행위를 하여서는 안 되며, 위반 시 계정 제재 및 서비스 이용이 제한될 수 있습니다:
            </p>
            <ul className="text-xs sm:text-sm text-gray-400 space-y-1 list-disc list-inside pl-1">
              <li>타인의 명예를 훼손하거나 지식재산권, 초상권 등 법적 권리를 침해하는 행위</li>
              <li>음란물, 폭력적 콘텐츠, 불법 행위를 조장하는 프롬프트 및 참조 이미지 업로드 행위</li>
              <li>비정상적인 자동화 도구(봇, 스크래퍼)를 사용하여 회사의 서버를 공격하거나 과부하를 유발하는 행위</li>
              <li>타인의 결제 수단을 도용하거나 허위 정보를 등록하는 행위</li>
            </ul>
          </section>

          {/* 제 7 조: 서비스 제공의 중단 및 면책 조항 */}
          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2 border-b border-white/10 pb-2">
              <span className="w-2 h-2 rounded-full bg-purple-400" />
              제 7 조 (면책 조항)
            </h2>
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 text-xs sm:text-sm text-gray-400 space-y-1.5 leading-relaxed">
              <p>
                1. 회사는 천재지변, 기간통신사업자의 회선 장애, 클라우드 인프라 장애 또는 인공지능 모델 제공사의 서비스 중단 등
                불가항력적인 사유로 인하여 서비스를 일시적으로 제공할 수 없는 경우 책임이 면제됩니다.
              </p>
              <p>
                2. AI 기술의 특성상 생성 결과물에 대해 완전무결성, 특정 목적에 대한 적합성 또는 정확성을 보증하지 않으며,
                결과물 사용으로 인해 발생하는 제3자와의 분쟁에 대해 고의 또는 중과실이 없는 한 책임을 지지 않습니다.
              </p>
            </div>
          </section>

          {/* 제 8 조: 준거법 및 관할 법원 */}
          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2 border-b border-white/10 pb-2">
              <span className="w-2 h-2 rounded-full bg-purple-400" />
              제 8 조 (준거법 및 관할 법원)
            </h2>
            <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
              본 약관의 해석 및 회사와 이용자 간의 분쟁에 대하여는 대한민국 법률을 준거법으로 적용하며,
              소송이 제기될 경우 민사소송법상의 관할 법원을 제1심 전속 관할 법원으로 합니다.
            </p>
          </section>

        </div>
      </main>

      {/* ── 하단 미니멀 푸터 ── */}
      <footer className="w-full py-8 text-center text-xs text-gray-500 border-t border-white/[0.05] z-10 space-y-2">
        <div className="flex items-center justify-center gap-4">
          <Link href="/terms" className="text-purple-400 hover:text-purple-300 font-semibold transition underline underline-offset-4">
            서비스 이용약관
          </Link>
          <span>·</span>
          <Link href="/privacy" className="hover:text-gray-300 transition underline underline-offset-4">
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
