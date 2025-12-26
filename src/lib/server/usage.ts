import { createClient } from '@supabase/supabase-js'
import { createHash } from 'crypto'
import { NextRequest } from 'next/server'

// 상수
export const FREE_LIMIT = 5

// 서버 사이드 Supabase 클라이언트
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null

// 환경변수에서 해시 솔트 가져오기
const HASH_SALT = process.env.USAGE_HASH_SALT || 'ai-detector-default-salt'

/**
 * IP 주소를 해시하여 개인정보 보호 (GDPR 준수)
 */
export function hashIp(ip: string): string {
  return createHash('sha256')
    .update(ip + HASH_SALT)
    .digest('hex')
}

/**
 * Next.js 요청에서 클라이언트 IP 추출
 * 다양한 프록시 헤더 처리
 */
export function getClientIp(request: NextRequest): string {
  // 일반적인 프록시 헤더 확인
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    // 체인에서 첫 번째 IP (원본 클라이언트)
    return forwardedFor.split(',')[0].trim()
  }

  const realIp = request.headers.get('x-real-ip')
  if (realIp) {
    return realIp.trim()
  }

  // Vercel 전용 헤더
  const vercelForwardedFor = request.headers.get('x-vercel-forwarded-for')
  if (vercelForwardedFor) {
    return vercelForwardedFor.split(',')[0].trim()
  }

  // 폴백 (프로덕션에서는 발생하지 않음)
  return '127.0.0.1'
}

/**
 * 데이터베이스에서 반환되는 사용량 레코드
 */
export interface UsageRecord {
  id: string
  ip_hash: string
  usage_count: number
  plan_type: 'free' | 'trial' | 'paid'
  paid_credits: number
  created_at: string
  updated_at: string
  last_used_at: string
}

/**
 * 클라이언트용 사용량 상태
 */
export interface UsageStatus {
  remainingFree: number
  paidCredits: number
  totalRemaining: number
  canUse: boolean
  usageCount: number
  planType: 'free' | 'trial' | 'paid'
}

/**
 * Supabase 설정 여부 확인
 */
export function isSupabaseConfigured(): boolean {
  return supabase !== null
}

/**
 * IP 해시에 대한 사용량 레코드 조회 또는 생성
 */
export async function getOrCreateUsage(ipHash: string): Promise<UsageRecord | null> {
  if (!supabase) {
    console.warn('Supabase 미설정, 사용량 추적 비활성화')
    return null
  }

  // 기존 레코드 조회 시도
  const { data: existing, error: fetchError } = await supabase
    .from('usage_log')
    .select('*')
    .eq('ip_hash', ipHash)
    .single()

  if (existing && !fetchError) {
    return existing as UsageRecord
  }

  // 레코드가 없으면 새로 생성
  if (fetchError?.code === 'PGRST116') { // 행 없음
    const { data: created, error: createError } = await supabase
      .from('usage_log')
      .insert({ ip_hash: ipHash })
      .select()
      .single()

    if (createError) {
      console.error('사용량 레코드 생성 실패:', createError)
      return null
    }

    return created as UsageRecord
  }

  console.error('사용량 레코드 조회 실패:', fetchError)
  return null
}

/**
 * 사용량 제한 확인 및 상태 반환
 */
export async function checkUsageLimit(ipHash: string): Promise<UsageStatus> {
  const record = await getOrCreateUsage(ipHash)

  // Supabase 미설정 시 기본 폴백
  if (!record) {
    return {
      remainingFree: FREE_LIMIT,
      paidCredits: 0,
      totalRemaining: FREE_LIMIT,
      canUse: true,
      usageCount: 0,
      planType: 'free'
    }
  }

  const remainingFree = Math.max(0, FREE_LIMIT - record.usage_count)
  const paidCredits = record.paid_credits
  const totalRemaining = remainingFree + paidCredits

  return {
    remainingFree,
    paidCredits,
    totalRemaining,
    canUse: totalRemaining > 0,
    usageCount: record.usage_count,
    planType: record.plan_type
  }
}

/**
 * 분석 성공 후 사용량 증가
 */
export async function incrementUsage(ipHash: string): Promise<boolean> {
  if (!supabase) {
    console.warn('Supabase 미설정, 사용량 증가 건너뜀')
    return true
  }

  const record = await getOrCreateUsage(ipHash)
  if (!record) {
    return false
  }

  const remainingFree = FREE_LIMIT - record.usage_count

  if (remainingFree > 0) {
    // 무료 크레딧 사용
    const { error } = await supabase
      .from('usage_log')
      .update({
        usage_count: record.usage_count + 1,
        last_used_at: new Date().toISOString()
      })
      .eq('ip_hash', ipHash)

    if (error) {
      console.error('사용량 증가 실패:', error)
      return false
    }
    return true
  } else if (record.paid_credits > 0) {
    // 유료 크레딧 사용
    const { error } = await supabase
      .from('usage_log')
      .update({
        paid_credits: record.paid_credits - 1,
        last_used_at: new Date().toISOString()
      })
      .eq('ip_hash', ipHash)

    if (error) {
      console.error('유료 크레딧 차감 실패:', error)
      return false
    }
    return true
  }

  return false
}

/**
 * IP 해시에 유료 크레딧 추가
 */
export async function addPaidCredits(ipHash: string, amount: number): Promise<boolean> {
  if (!supabase) {
    console.warn('Supabase 미설정, 크레딧 추가 불가')
    return false
  }

  const record = await getOrCreateUsage(ipHash)
  if (!record) {
    return false
  }

  const { error } = await supabase
    .from('usage_log')
    .update({
      paid_credits: record.paid_credits + amount,
      plan_type: 'paid'
    })
    .eq('ip_hash', ipHash)

  if (error) {
    console.error('유료 크레딧 추가 실패:', error)
    return false
  }

  return true
}
