'use client'

import { useState, useEffect, useCallback } from 'react'
import { FREE_USAGE_LIMIT } from '@/types/usage'

// 서버 API 응답 타입
interface UsageStatus {
  remainingFree: number
  paidCredits: number
  totalRemaining: number
  canUse: boolean
  usageCount: number
  planType: 'free' | 'trial' | 'paid'
  configured: boolean
}

interface UseUsageReturn {
  remainingCredits: number
  remainingFreeUsage: number
  paidCredits: number
  canUse: boolean
  isLoading: boolean
  error: string | null
  incrementUsage: () => void
  addCredits: (amount: number) => Promise<boolean>
  refresh: () => Promise<void>
}

// 기본 상태 (서버 응답 전)
const defaultStatus: UsageStatus = {
  remainingFree: FREE_USAGE_LIMIT,
  paidCredits: 0,
  totalRemaining: FREE_USAGE_LIMIT,
  canUse: true,
  usageCount: 0,
  planType: 'free',
  configured: false,
}

export function useUsage(): UseUsageReturn {
  const [status, setStatus] = useState<UsageStatus>(defaultStatus)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 서버에서 사용량 상태 가져오기
  const refresh = useCallback(async () => {
    try {
      setError(null)
      // 캐시 무효화: 타임스탬프로 Edge 등 모든 브라우저에서 확실히 캐시 방지
      const response = await fetch(`/api/usage?t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      })

      if (!response.ok) {
        throw new Error('사용량 조회 실패')
      }

      const data: UsageStatus = await response.json()
      setStatus(data)
    } catch (err) {
      console.error('Usage fetch error:', err)
      setError(err instanceof Error ? err.message : '오류 발생')
      // 에러 시 기본값으로 폴백 (사용 허용)
      setStatus(defaultStatus)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // 컴포넌트 마운트 시 사용량 조회
  useEffect(() => {
    refresh()
  }, [refresh])

  // 사용량 증가 (서버에서 자동 처리되므로 refresh만 호출)
  const incrementUsage = useCallback(() => {
    // 분석 API가 서버에서 자동으로 사용량을 증가시키므로
    // 클라이언트에서는 상태만 새로고침
    refresh()
  }, [refresh])

  // 유료 크레딧 추가
  const addCredits = useCallback(async (amount: number): Promise<boolean> => {
    try {
      setError(null)
      const response = await fetch('/api/usage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credits: amount }),
      })

      if (!response.ok) {
        throw new Error('크레딧 추가 실패')
      }

      const data: UsageStatus = await response.json()
      setStatus(data)
      return true
    } catch (err) {
      console.error('Add credits error:', err)
      setError(err instanceof Error ? err.message : '오류 발생')
      return false
    }
  }, [])

  return {
    remainingCredits: status.totalRemaining,
    remainingFreeUsage: status.remainingFree,
    paidCredits: status.paidCredits,
    canUse: status.canUse,
    isLoading,
    error,
    incrementUsage,
    addCredits,
    refresh,
  }
}
