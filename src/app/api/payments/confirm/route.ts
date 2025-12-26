import { NextRequest, NextResponse } from 'next/server'

/**
 * 결제 확인 요청 파라미터 타입
 */
interface ConfirmPaymentRequest {
  paymentKey: string
  orderId: string
  amount: number
}

/**
 * Toss Payments API 응답 타입
 */
interface TossPaymentResponse {
  status: string
  totalAmount: number
  code?: string
  message?: string
}

/**
 * POST /api/payments/confirm
 * Toss Payments 결제 확인 API
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as Partial<ConfirmPaymentRequest>

    // 파라미터 검증
    if (!body.paymentKey) {
      return NextResponse.json(
        { error: 'paymentKey is required' },
        { status: 400 }
      )
    }

    if (!body.orderId) {
      return NextResponse.json(
        { error: 'orderId is required' },
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

    const tossResponse = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        paymentKey: body.paymentKey,
        orderId: body.orderId,
        amount: body.amount,
      }),
    })

    const tossData = await tossResponse.json() as TossPaymentResponse

    if (!tossResponse.ok) {
      return NextResponse.json(
        { error: tossData.message || 'Payment confirmation failed', code: tossData.code },
        { status: 400 }
      )
    }

    // TODO: 크레딧 추가 로직 구현
    return NextResponse.json({
      success: true,
      amount: tossData.totalAmount,
    })
  } catch {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    )
  }
}
