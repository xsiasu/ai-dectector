import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { getClientIp, hashIp, FREE_LIMIT } from '@/lib/server/usage'

/**
 * POST /api/auth/merge-usage
 * 로그인 후 IP 기반 사용량과 세션 기반 기록을 사용자 계정으로 병합
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // 현재 로그인한 사용자 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    // 클라이언트 IP 해시
    const clientIp = getClientIp(request)
    const ipHash = hashIp(clientIp)

    // 클라이언트에서 전송한 session_id
    const sessionId = request.headers.get('x-session-id')

    // 관리자 권한 클라이언트 생성 (RLS 우회)
    const adminSupabase = createServiceClient()

    // 1. 사용량 병합 (RPC 대신 수동 처리로 변경하여 정확성 확보)
    await manualMerge(adminSupabase, ipHash, user.id)

    // 2. 분석 기록 병합 (session_id가 있는 경우)
    if (sessionId) {
      // 기록 병합도 관리자 권한으로 수행
      await manualHistoryMerge(adminSupabase, sessionId, user.id)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Merge usage error:', error)
    return NextResponse.json(
      { error: '사용량 병합 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

/**
 * 수동 병합
 */
async function manualMerge(
  supabase: ReturnType<typeof createServiceClient>,
  ipHash: string,
  userId: string
) {
  // IP 해시로 기존 레코드 조회
  const { data: ipRecord } = await supabase
    .from('usage_log')
    .select('*')
    .eq('ip_hash', ipHash)
    .is('user_id', null)
    .single()

  if (!ipRecord) {
    return // 병합할 레코드 없음
  }

  // 사용자 ID로 기존 레코드 조회
  const { data: userRecord } = await supabase
    .from('usage_log')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (userRecord) {
    // 사용자 레코드가 있으면 병합
    // 무료 사용량은 합산하되 한도(FREE_LIMIT)를 넘지 않도록
    // 유료 크레딧은 단순 합산
    const mergedUsageCount = Math.min(
      FREE_LIMIT,
      userRecord.usage_count + ipRecord.usage_count
    )

    await supabase
      .from('usage_log')
      .update({
        paid_credits: userRecord.paid_credits + ipRecord.paid_credits,
        usage_count: mergedUsageCount,
      })
      .eq('user_id', userId)

    // IP 기반 레코드 삭제
    await supabase
      .from('usage_log')
      .delete()
      .eq('ip_hash', ipHash)
      .is('user_id', null)
  } else {
    // 사용자 레코드가 없으면 IP 레코드에 user_id 연결
    await supabase
      .from('usage_log')
      .update({ user_id: userId })
      .eq('ip_hash', ipHash)
      .is('user_id', null)
  }
}

/**
 * 수동 기록 병합
 */
async function manualHistoryMerge(
  supabase: ReturnType<typeof createServiceClient>,
  sessionId: string,
  userId: string
) {
  // session_id 기반 기록에 user_id 연결
  await supabase
    .from('analysis_history')
    .update({ user_id: userId })
    .eq('session_id', sessionId)
    .is('user_id', null)
}

