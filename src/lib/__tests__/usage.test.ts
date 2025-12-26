import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  getUsageData,
  incrementUsage,
  hasRemainingCredits,
  addCredits,
  getCredits,
  canUseService,
  resetUsage,
} from '../usage'
import { FREE_USAGE_LIMIT } from '@/types/usage'

const mockLocalStorage = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key]
    }),
    clear: vi.fn(() => {
      store = {}
    }),
  }
})()

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
})

describe('usage', () => {
  beforeEach(() => {
    mockLocalStorage.clear()
    vi.clearAllMocks()
  })

  describe('getUsageData', () => {
    it('should return default usage data when no data exists', () => {
      const data = getUsageData()
      expect(data.freeUsageCount).toBe(0)
      expect(data.paidCredits).toBe(0)
      expect(data.totalAnalyzed).toBe(0)
    })

    it('should return stored usage data when data exists', () => {
      const storedData = {
        freeUsageCount: 3,
        paidCredits: 10,
        lastUsedDate: '2025-12-26',
        totalAnalyzed: 13,
      }
      mockLocalStorage.setItem('ai-detector-usage', JSON.stringify(storedData))

      const data = getUsageData()
      expect(data.freeUsageCount).toBe(3)
      expect(data.paidCredits).toBe(10)
      expect(data.totalAnalyzed).toBe(13)
    })
  })

  describe('incrementUsage', () => {
    it('should increment free usage count when under limit', () => {
      incrementUsage()
      const data = getUsageData()
      expect(data.freeUsageCount).toBe(1)
      expect(data.totalAnalyzed).toBe(1)
    })

    it('should use paid credits when free usage is exhausted', () => {
      const storedData = {
        freeUsageCount: FREE_USAGE_LIMIT,
        paidCredits: 5,
        lastUsedDate: '2025-12-26',
        totalAnalyzed: 5,
      }
      mockLocalStorage.setItem('ai-detector-usage', JSON.stringify(storedData))

      incrementUsage()
      const data = getUsageData()
      expect(data.freeUsageCount).toBe(FREE_USAGE_LIMIT)
      expect(data.paidCredits).toBe(4)
      expect(data.totalAnalyzed).toBe(6)
    })
  })

  describe('hasRemainingCredits', () => {
    it('should return true when free usage is available', () => {
      expect(hasRemainingCredits()).toBe(true)
    })

    it('should return true when paid credits are available', () => {
      const storedData = {
        freeUsageCount: FREE_USAGE_LIMIT,
        paidCredits: 1,
        lastUsedDate: '2025-12-26',
        totalAnalyzed: 5,
      }
      mockLocalStorage.setItem('ai-detector-usage', JSON.stringify(storedData))

      expect(hasRemainingCredits()).toBe(true)
    })

    it('should return false when no credits are available', () => {
      const storedData = {
        freeUsageCount: FREE_USAGE_LIMIT,
        paidCredits: 0,
        lastUsedDate: '2025-12-26',
        totalAnalyzed: 5,
      }
      mockLocalStorage.setItem('ai-detector-usage', JSON.stringify(storedData))

      expect(hasRemainingCredits()).toBe(false)
    })
  })

  describe('addCredits', () => {
    it('should add credits to existing credits', () => {
      addCredits(10)
      // getCredits() returns total available (free + paid)
      // Initial: 5 free + 10 paid = 15
      expect(getCredits()).toBe(FREE_USAGE_LIMIT + 10)

      addCredits(5)
      expect(getCredits()).toBe(FREE_USAGE_LIMIT + 15)
    })
  })

  describe('getCredits', () => {
    it('should return total available credits (free + paid)', () => {
      expect(getCredits()).toBe(FREE_USAGE_LIMIT)

      incrementUsage()
      expect(getCredits()).toBe(FREE_USAGE_LIMIT - 1)
    })
  })

  describe('canUseService', () => {
    it('should return true when credits are available', () => {
      expect(canUseService()).toBe(true)
    })

    it('should return false when no credits are available', () => {
      const storedData = {
        freeUsageCount: FREE_USAGE_LIMIT,
        paidCredits: 0,
        lastUsedDate: '2025-12-26',
        totalAnalyzed: 5,
      }
      mockLocalStorage.setItem('ai-detector-usage', JSON.stringify(storedData))

      expect(canUseService()).toBe(false)
    })
  })

  describe('resetUsage', () => {
    it('should reset all usage data', () => {
      incrementUsage()
      incrementUsage()
      addCredits(10)

      resetUsage()
      const data = getUsageData()
      expect(data.freeUsageCount).toBe(0)
      expect(data.paidCredits).toBe(0)
      expect(data.totalAnalyzed).toBe(0)
    })
  })
})
