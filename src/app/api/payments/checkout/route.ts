import { NextRequest, NextResponse } from 'next/server'

/**
 * 결제 요청 파라미터 타입
 */
interface CheckoutRequest {
  orderId: string
  orderName: string
  amount: number
}

/**
 * Toss Payments API 응답 타입
 */
interface TossCheckoutResponse {
  paymentKey: string
  checkout: {
    url: string
  }
  code?: string
  message?: string
}

/**
 * POST /api/payments/checkout
 * Toss Payments 결제 요청 생성 (API 개별 연동 방식)
 * - 클라이언트에서 결제 정보 받음
 * - Toss API로 결제 요청 생성
 * - checkout URL 반환 → 클라이언트에서 리다이렉트
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as Partial<CheckoutRequest>

    // 파라미터 검증
    if (!body.orderId) {
      return NextResponse.json(
        { error: 'orderId is required' },
        { status: 400 }
      )
    }

    if (!body.orderName) {
      return NextResponse.json(
        { error: 'orderName is required' },
        { status: 400 }
      )
    }

    if (!body.amount || body.amount <= 0) {
      return NextResponse.json(
        { error: 'amount must be greater than 0' },
        { status: 400 }
      )
    }

    // Toss API 호출
    const secretKey = process.env.TOSS_SECRET_KEY
    if (!secretKey) {
      return NextResponse.json(
        { error: 'Payment configuration error' },
        { status: 500 }
      )
    }

    // Base64 인코딩: secretKey + ':'
    const authToken = Buffer.from(`${secretKey}:`).toString('base64')

    // 앱 URL 설정
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    const tossResponse = await fetch('https://api.tosspayments.com/v1/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        method: '카드',
        amount: body.amount,
        orderId: body.orderId,
        orderName: body.orderName,
        successUrl: `${appUrl}/payment/success`,
        failUrl: `${appUrl}/payment/fail`,
      }),
    })

    const tossData = await tossResponse.json() as TossCheckoutResponse

    if (!tossResponse.ok) {
      return NextResponse.json(
        { error: tossData.message || 'Payment request failed', code: tossData.code },
        { status: 400 }
      )
    }

    // checkout URL 반환
    return NextResponse.json({
      checkoutUrl: tossData.checkout.url,
      paymentKey: tossData.paymentKey,
    })
  } catch {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    )
  }
}
