'use client';

/**
 * contexts/AuthContext.tsx
 *
 * 전역 인증 상태 관리 Context
 * ─────────────────────────────────────────────────────────────
 * 역할:
 *   - Supabase 세션을 실시간으로 감지해 전역 상태로 관리
 *   - `useAuth()` 훅으로 어디서든 로그인 상태/유저 정보 접근 가능
 *   - 로그아웃 함수 제공
 *
 * 사용법:
 *   import { useAuth } from '@/contexts/AuthContext'
 *   const { user, session, loading, signOut } = useAuth()
 */

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';

// ── Context에서 제공하는 값의 타입 정의 ─────────────────────────
interface AuthContextValue {
  /** 현재 로그인한 사용자 정보 (로그아웃 상태면 null) */
  user: User | null;
  /** 현재 세션 전체 객체 (JWT, 만료시간 등 포함) */
  session: Session | null;
  /** 세션 초기 확인 중 여부 (true이면 로딩 스피너 표시에 활용) */
  loading: boolean;
  /** 로그아웃 함수 */
  signOut: () => Promise<void>;
}

// ── Context 생성 (초기값은 undefined — Provider 없이 쓰면 에러) ─
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// ── AuthProvider 컴포넌트 ────────────────────────────────────────
/**
 * 앱 전체를 감싸는 Provider.
 * app/layout.tsx 의 <body> 안에 넣어 사용합니다.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  // 첫 세션 확인이 끝나기 전까지 loading = true
  const [loading, setLoading] = useState(true);

  // Supabase 브라우저 클라이언트 (싱글턴)
  const supabase = createClient();

  useEffect(() => {
    /**
     * 1) 최초 마운트 시 현재 세션을 가져옵니다.
     *    getSession()은 로컬 스토리지/쿠키에서 세션을 읽어옵니다.
     *    보안 주의: getSession()의 session은 클라이언트 스토리지에서 오므로
     *    신뢰도가 낮습니다. 서버에서 권한 검증이 필요하면 getUser()를 사용하세요.
     */
    const initSession = async () => {
      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession();

      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setLoading(false); // 초기 확인 완료
    };

    initSession();

    /**
     * 2) 로그인/로그아웃/토큰 갱신 등 인증 상태 변화를 실시간으로 감지합니다.
     *    onAuthStateChange는 이벤트 리스너를 등록하고 구독 해제 함수를 반환합니다.
     */
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      setLoading(false);
    });

    // 컴포넌트 언마운트 시 리스너 정리 (메모리 누수 방지)
    return () => {
      subscription.unsubscribe();
    };
  }, [supabase.auth]);

  /**
   * 로그아웃 함수
   * signOut()을 호출하면 onAuthStateChange가 자동으로 상태를 업데이트합니다.
   */
  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, [supabase.auth]);

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

// ── useAuth 커스텀 훅 ────────────────────────────────────────────
/**
 * AuthContext에서 값을 꺼내는 편의 훅.
 * 반드시 <AuthProvider> 하위에서 호출해야 합니다.
 *
 * 사용 예:
 *   const { user, loading, signOut } = useAuth()
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth()는 <AuthProvider> 내부에서만 사용할 수 있습니다.');
  }
  return context;
}
