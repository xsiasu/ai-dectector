'use client'

import { createBrowserClient } from '@supabase/ssr'

// 싱글톤 인스턴스
let supabaseInstance: ReturnType<typeof createBrowserClient> | null = null

/**
 * 브라우저용 Supabase 클라이언트 생성 (싱글톤)
 * 클라이언트 컴포넌트에서 사용
 */
export function createClient() {
  // 이미 인스턴스가 있으면 재사용
  if (supabaseInstance) {
    return supabaseInstance
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    // 빌드 시 정적 페이지 생성 단계에서는 환경변수가 없을 수 있음
    return null
  }

  supabaseInstance = createBrowserClient(supabaseUrl, supabaseAnonKey)
  return supabaseInstance
}
