import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { POST } from '../route'
import { NextRequest } from 'next/server'

// 테스트용 요청 생성 헬퍼
function createRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest('http://localhost:3000/api/payments/confirm', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

// 환경 변수 모킹
const originalEnv = process.env

describe('POST /api/payments/confirm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env = { ...originalEnv, TOSS_SECRET_KEY: 'test_sk_secret' }
  })

  afterEach(() => {
    process.env = originalEnv
    vi.restoreAllMocks()
  })

  describe('파라미터 검증', () => {
    it('paymentKey가 누락되면 400을 반환해야 한다', async () => {
      const request = createRequest({
        orderId: 'order_123',
        amount: 1000,
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toContain('paymentKey')
    })

    it('orderId가 누락되면 400을 반환해야 한다', async () => {
      const request = createRequest({
        paymentKey: 'pk_123',
        amount: 1000,
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toContain('orderId')
    })

    it('amount가 0 이하면 400을 반환해야 한다', async () => {
      const request = createRequest({
        paymentKey: 'pk_123',
        orderId: 'order_123',
        amount: 0,
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toContain('amount')
    })
  })

  describe('Toss API 호출', () => {
    it('올바른 Authorization 헤더로 Toss API를 호출해야 한다', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          status: 'DONE',
          totalAmount: 1000,
        }),
      })
      global.fetch = mockFetch

      const request = createRequest({
        paymentKey: 'pk_123',
        orderId: 'order_123',
        amount: 1000,
      })

      await POST(request)

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.tosspayments.com/v1/payments/confirm',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': expect.stringMatching(/^Basic /),
            'Content-Type': 'application/json',
          }),
        })
      )
    })

    it('Toss API 성공 시 200과 success: true를 반환해야 한다', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          status: 'DONE',
          totalAmount: 1000,
        }),
      })
      global.fetch = mockFetch

      const request = createRequest({
        paymentKey: 'pk_123',
        orderId: 'order_123',
        amount: 1000,
      })

      const response = await POST(request)

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
    })

    it('Toss API 실패 시 에러를 반환해야 한다', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({
          code: 'INVALID_PAYMENT_KEY',
          message: '유효하지 않은 결제 키입니다.',
        }),
      })
      global.fetch = mockFetch

      const request = createRequest({
        paymentKey: 'invalid_key',
        orderId: 'order_123',
        amount: 1000,
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBeDefined()
    })
  })
})
