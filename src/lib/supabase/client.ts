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
    throw new Error('Supabase 환경변수가 설정되지 않았습니다.')
  }

  supabaseInstance = createBrowserClient(supabaseUrl, supabaseAnonKey)
  return supabaseInstance
}
