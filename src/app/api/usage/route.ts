import { NextRequest, NextResponse } from 'next/server'
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
 * Returns current usage status for the client IP
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
        configured: false
      })
    }

    const clientIp = getClientIp(request)
    const ipHash = hashIp(clientIp)
    const status = await checkUsageLimit(ipHash)

    return NextResponse.json({
      ...status,
      configured: true
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
 * Add paid credits to the client IP
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

    const success = await addPaidCredits(ipHash, credits)

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to add credits' },
        { status: 500 }
      )
    }

    // Return updated status
    const status = await checkUsageLimit(ipHash)

    return NextResponse.json({
      success: true,
      ...status
    })
  } catch (error) {
    console.error('Add credits error:', error)
    return NextResponse.json(
      { error: 'Failed to add credits' },
      { status: 500 }
    )
  }
}
