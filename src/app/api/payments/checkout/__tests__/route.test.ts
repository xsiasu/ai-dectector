import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { POST } from '../route'
import { NextRequest } from 'next/server'

// 테스트용 요청 생성 헬퍼
function createRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest('http://localhost:3000/api/payments/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

// 환경 변수 모킹
const originalEnv = process.env

describe('POST /api/payments/checkout', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env = { ...originalEnv, TOSS_SECRET_KEY: 'test_sk_secret' }
  })

  afterEach(() => {
    process.env = originalEnv
    vi.restoreAllMocks()
  })

  describe('파라미터 검증', () => {
    it('orderId가 누락되면 400을 반환해야 한다', async () => {
      const request = createRequest({
        orderName: '10회권',
        amount: 1000,
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toContain('orderId')
    })

    it('orderName이 누락되면 400을 반환해야 한다', async () => {
      const request = createRequest({
        orderId: 'order_123',
        amount: 1000,
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toContain('orderName')
    })

    it('amount가 0 이하면 400을 반환해야 한다', async () => {
      const request = createRequest({
        orderId: 'order_123',
        orderName: '10회권',
        amount: 0,
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toContain('amount')
    })
  })

  describe('Toss API 호출', () => {
    it('Toss API 성공 시 checkoutUrl을 반환해야 한다', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          paymentKey: 'pk_123',
          checkout: {
            url: 'https://pay.toss.im/checkout/123',
          },
        }),
      })
      global.fetch = mockFetch

      const request = createRequest({
        orderId: 'order_123',
        orderName: '10회권',
        amount: 1000,
      })

      const response = await POST(request)

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.checkoutUrl).toBe('https://pay.toss.im/checkout/123')
    })

    it('Toss API 실패 시 에러를 반환해야 한다', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({
          code: 'INVALID_REQUEST',
          message: '잘못된 요청입니다.',
        }),
      })
      global.fetch = mockFetch

      const request = createRequest({
        orderId: 'order_123',
        orderName: '10회권',
        amount: 1000,
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBeDefined()
    })
  })
})
