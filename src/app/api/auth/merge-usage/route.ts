import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getClientIp, hashIp } from '@/lib/server/usage'

/**
 * POST /api/auth/merge-usage
 * 로그인 후 IP 기반 사용량을 사용자 계정으로 병합
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

    // Supabase에서 병합 함수 호출
    const { error: mergeError } = await supabase.rpc('merge_usage_to_user', {
      p_ip_hash: ipHash,
      p_user_id: user.id,
    })

    if (mergeError) {
      console.error('사용량 병합 실패:', mergeError)
      // 함수가 없을 수 있으므로 에러를 무시하고 수동 병합 시도
      await manualMerge(supabase, ipHash, user.id)
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
 * 수동 병합 (RPC 함수 없을 때 폴백)
 */
async function manualMerge(
  supabase: Awaited<ReturnType<typeof createClient>>,
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
    // 사용자 레코드가 있으면 크레딧 합산
    await supabase
      .from('usage_log')
      .update({
        paid_credits: userRecord.paid_credits + ipRecord.paid_credits,
        usage_count: Math.max(userRecord.usage_count, ipRecord.usage_count),
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
