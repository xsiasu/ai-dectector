import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * 서버용 Supabase 클라이언트 생성
 * Server Components, Route Handlers, Server Actions에서 사용
 */
export async function createClient() {
  const cookieStore = await cookies()

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase 환경변수가 설정되지 않았습니다.')
  }

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        } catch {
          // Server Component에서 호출 시 쿠키 설정 불가
          // 미들웨어에서 세션 새로고침 처리
        }
      },
    },
  })
}

/**
 * Service Role 권한의 Supabase 클라이언트 (관리자용)
 * 주의: 서버 사이드에서만 사용, 클라이언트에 노출 금지
 */
export function createServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase Service Role 키가 설정되지 않았습니다.')
  }

  // Service Role은 RLS를 우회하므로 주의해서 사용
  const { createClient } = require('@supabase/supabase-js')
  return createClient(supabaseUrl, supabaseServiceKey)
}
