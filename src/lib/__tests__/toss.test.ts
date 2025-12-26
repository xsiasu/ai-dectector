import { describe, it, expect } from 'vitest'
import { generateOrderId, validatePaymentParams } from '../toss'

describe('generateOrderId', () => {
  it('6-64자 길이의 문자열을 반환해야 한다', () => {
    const orderId = generateOrderId()

    expect(orderId.length).toBeGreaterThanOrEqual(6)
    expect(orderId.length).toBeLessThanOrEqual(64)
  })

  it('영숫자와 -, _ 문자만 포함해야 한다', () => {
    const orderId = generateOrderId()

    expect(orderId).toMatch(/^[a-zA-Z0-9\-_]+$/)
  })

  it('호출할 때마다 고유한 ID를 생성해야 한다', () => {
    const orderIds = new Set<string>()

    for (let i = 0; i < 100; i++) {
      orderIds.add(generateOrderId())
    }

    expect(orderIds.size).toBe(100)
  })
})

describe('validatePaymentParams', () => {
  it('유효한 파라미터는 true를 반환해야 한다', () => {
    const params = {
      amount: 1000,
      orderId: 'order_123',
      orderName: '10회권',
    }

    expect(validatePaymentParams(params)).toBe(true)
  })

  it('금액이 0 이하면 false를 반환해야 한다', () => {
    expect(validatePaymentParams({ amount: 0, orderId: 'order_123', orderName: '10회권' })).toBe(false)
    expect(validatePaymentParams({ amount: -100, orderId: 'order_123', orderName: '10회권' })).toBe(false)
  })

  it('주문 ID가 빈 문자열이면 false를 반환해야 한다', () => {
    expect(validatePaymentParams({ amount: 1000, orderId: '', orderName: '10회권' })).toBe(false)
  })

  it('주문명이 빈 문자열이면 false를 반환해야 한다', () => {
    expect(validatePaymentParams({ amount: 1000, orderId: 'order_123', orderName: '' })).toBe(false)
  })
})
