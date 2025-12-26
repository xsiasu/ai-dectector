import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/payments
 * 현재 로그인한 사용자의 결제 내역 조회
 */
export async function GET() {
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

    // 결제 내역 조회 (최신순)
    const { data: payments, error } = await supabase
      .from('payment_history')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      console.error('결제 내역 조회 실패:', error)
      return NextResponse.json(
        { error: '결제 내역을 불러올 수 없습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ payments })
  } catch (error) {
    console.error('Payments API error:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/payments
 * 결제 내역 기록 (서버에서만 호출)
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

    const body = await request.json()
    const { amount, credits, packageName } = body

    if (typeof amount !== 'number' || typeof credits !== 'number') {
      return NextResponse.json(
        { error: '잘못된 요청입니다.' },
        { status: 400 }
      )
    }

    // 결제 내역 저장
    const { data: payment, error } = await supabase
      .from('payment_history')
      .insert({
        user_id: user.id,
        amount,
        credits,
        package_name: packageName,
        status: 'completed',
      })
      .select()
      .single()

    if (error) {
      console.error('결제 내역 저장 실패:', error)
      return NextResponse.json(
        { error: '결제 내역을 저장할 수 없습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, payment })
  } catch (error) {
    console.error('Payment record error:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
