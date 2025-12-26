/**
 * Toss Payments SDK 유틸리티
 * 주문 ID 생성 및 결제 파라미터 검증 함수 제공
 */

/**
 * 결제 요청 파라미터 타입
 */
export interface PaymentParams {
  amount: number
  orderId: string
  orderName: string
}

/**
 * Toss Payments 주문 ID 생성
 * - 6-64자 길이
 * - 영숫자, -, _ 문자만 허용
 * - 고유성 보장을 위해 타임스탬프 + 랜덤 문자열 사용
 */
export function generateOrderId(): string {
  const timestamp = Date.now().toString(36)
  const randomPart = Math.random().toString(36).substring(2, 10)

  return `order_${timestamp}_${randomPart}`
}

/**
 * 결제 파라미터 검증
 * - amount: 0보다 커야 함
 * - orderId: 빈 문자열 불가
 * - orderName: 빈 문자열 불가
 */
export function validatePaymentParams(params: PaymentParams): boolean {
  if (params.amount <= 0) {
    return false
  }

  if (!params.orderId || params.orderId.trim() === '') {
    return false
  }

  if (!params.orderName || params.orderName.trim() === '') {
    return false
  }

  return true
}
