import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  getClientIp,
  hashIp,
  checkUsageLimit,
  addPaidCredits,
  isSupabaseConfigured,
  FREE_LIMIT
} from '@/lib/server/usage'

/**
 * GET /api/usage
 * Returns current usage status for the client IP or user ID
 */
export async function GET(request: NextRequest) {
  try {
    // Check if Supabase is configured
    if (!isSupabaseConfigured()) {
      // Fallback to unlimited usage when not configured
      return NextResponse.json({
        remainingFree: FREE_LIMIT,
        paidCredits: 0,
        totalRemaining: FREE_LIMIT,
        canUse: true,
        usageCount: 0,
        planType: 'free',
        configured: false,
        authenticated: false
      })
    }

    // 인증된 사용자인지 확인
    let userId: string | undefined
    try {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      userId = user?.id
    } catch {
      // 인증 실패 시 IP 기반으로 진행
    }

    const clientIp = getClientIp(request)
    const ipHash = hashIp(clientIp)
    // userId가 있으면 user_id 기반, 없으면 ip_hash 기반
    const status = await checkUsageLimit(ipHash, userId)

    // 캐시 방지: 항상 최신 사용량 반환
    return NextResponse.json({
      ...status,
      configured: true,
      authenticated: !!userId
    }, {
      headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' }
    })
  } catch (error) {
    console.error('Usage check error:', error)
    return NextResponse.json(
      { error: 'Failed to check usage' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/usage
 * Add paid credits to the client IP or user
 * Body: { credits: number }
 */
export async function POST(request: NextRequest) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { error: 'Usage tracking not configured' },
        { status: 503 }
      )
    }

    // 인증된 사용자인지 확인
    let userId: string | undefined
    try {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      userId = user?.id
    } catch {
      // 인증 실패 시 IP 기반으로 진행
    }

    const body = await request.json()
    const { credits } = body

    if (typeof credits !== 'number' || credits <= 0) {
      return NextResponse.json(
        { error: 'Invalid credits amount' },
        { status: 400 }
      )
    }

    const clientIp = getClientIp(request)
    const ipHash = hashIp(clientIp)

    // userId가 있으면 user_id 기반, 없으면 ip_hash 기반
    const success = await addPaidCredits(ipHash, credits, userId)

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to add credits' },
        { status: 500 }
      )
    }

    // Return updated status
    const status = await checkUsageLimit(ipHash, userId)

    // 캐시 방지: 항상 최신 사용량 반환
    return NextResponse.json({
      success: true,
      ...status,
      authenticated: !!userId
    }, {
      headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' }
    })
  } catch (error) {
    console.error('Add credits error:', error)
    return NextResponse.json(
      { error: 'Failed to add credits' },
      { status: 500 }
    )
  }
}
