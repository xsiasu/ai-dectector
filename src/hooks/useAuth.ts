'use client'

import { useState, useEffect, useCallback } from 'react'
import { User, Session, AuthChangeEvent } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'

type Provider = 'google' | 'kakao'

interface UseAuthReturn {
  user: User | null
  session: Session | null
  isLoading: boolean
  isAuthenticated: boolean
  signInWithProvider: (provider: Provider) => Promise<void>
  signOut: () => Promise<void>
  refresh: () => Promise<void>
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const supabase = createClient()

  // Supabase 클라이언트가 없으면 비인증 상태 반환 (빌드 시 정적 페이지 생성용)
  if (!supabase) {
    return {
      user: null,
      session: null,
      isLoading: false,
      isAuthenticated: false,
      signInWithProvider: async () => {},
      signOut: async () => {},
      refresh: async () => {},
    }
  }

  // 세션 상태 새로고침
  const refresh = useCallback(async () => {
    try {
      const { data: { session: currentSession } } = await supabase.auth.getSession()
      setSession(currentSession)
      setUser(currentSession?.user ?? null)
    } catch (error) {
      console.error('세션 조회 실패:', error)
      setSession(null)
      setUser(null)
    } finally {
      setIsLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 초기 세션 로드 및 변경 감지
  useEffect(() => {
    refresh()

    // 인증 상태 변경 리스너
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, currentSession: Session | null) => {
        setSession(currentSession)
        setUser(currentSession?.user ?? null)
        setIsLoading(false)

        // 로그인 성공 시 사용량 병합 API 호출
        if (event === 'SIGNED_IN' && currentSession?.user) {
          try {
            await fetch('/api/auth/merge-usage', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
            })
            // 병합 완료 후 이벤트 발생 (UI 새로고침 트리거)
            window.dispatchEvent(new CustomEvent('auth:usage-merged'))
          } catch (error) {
            console.error('사용량 병합 실패:', error)
          }
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 소셜 로그인
  const signInWithProvider = useCallback(async (provider: Provider) => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      console.error(`${provider} 로그인 실패:`, error)
      throw error
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 로그아웃
  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut()

    if (error) {
      console.error('로그아웃 실패:', error)
      throw error
    }

    setUser(null)
    setSession(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return {
    user,
    session,
    isLoading,
    isAuthenticated: !!user,
    signInWithProvider,
    signOut,
    refresh,
  }
}
