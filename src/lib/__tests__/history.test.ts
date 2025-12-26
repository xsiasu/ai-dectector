import { describe, it, expect, beforeEach, vi, Mock } from 'vitest'
import { HistoryItemInput, HistoryDbRow } from '@/types/history'
import { AnalysisResult } from '@/types/index'

// Mock modules BEFORE any imports that use them
vi.mock('../supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
  isSupabaseConfigured: () => true,
}))

vi.mock('../session', () => ({
  getSessionId: () => 'test-session-id',
}))

// Import the module under test AFTER mocking
import { supabase } from '../supabase'
import {
  saveAnalysis,
  getHistory,
  getHistoryItem,
  deleteHistoryItem,
  clearHistory,
} from '../history'

const mockAnalysisResult: AnalysisResult = {
  isAI: true,
  confidence: 85,
  evidence: ['Digital fingerprint detected', 'Frequency pattern anomaly'],
  riskLevel: 'high',
  contentType: 'ai_generated',
  analysisMethod: 'combined',
}

const mockHistoryInput: HistoryItemInput = {
  imageUrl: 'https://example.com/image.jpg',
  source: 'url',
  sourceUrl: 'https://example.com/page',
  result: mockAnalysisResult,
}

const mockDbRow: HistoryDbRow = {
  id: 'test-uuid-1',
  session_id: 'test-session-id',
  created_at: '2025-12-26T12:00:00Z',
  image_url: 'https://example.com/image.jpg',
  image_thumbnail: null,
  source: 'url',
  source_url: 'https://example.com/page',
  is_ai: true,
  confidence: 85,
  risk_level: 'high',
  evidence: ['Digital fingerprint detected', 'Frequency pattern anomaly'],
  content_type: 'ai_generated',
  analysis_method: 'combined',
}

describe('history', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('saveAnalysis', () => {
    it('should save analysis result to Supabase', async () => {
      const mockFrom = vi.fn().mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockDbRow,
              error: null,
            }),
          }),
        }),
      })
      ;(supabase!.from as Mock) = mockFrom

      const result = await saveAnalysis(mockHistoryInput)

      expect(mockFrom).toHaveBeenCalledWith('analysis_history')
      expect(result).not.toBeNull()
      expect(result?.isAI).toBe(true)
      expect(result?.confidence).toBe(85)
    })

    it('should return null when Supabase returns error', async () => {
      const mockFrom = vi.fn().mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: new Error('Database error'),
            }),
          }),
        }),
      })
      ;(supabase!.from as Mock) = mockFrom

      const result = await saveAnalysis(mockHistoryInput)
      expect(result).toBeNull()
    })
  })

  describe('getHistory', () => {
    it('should return history items from Supabase', async () => {
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({
                data: [mockDbRow],
                error: null,
              }),
            }),
          }),
        }),
      })
      ;(supabase!.from as Mock) = mockFrom

      const result = await getHistory(10)

      expect(mockFrom).toHaveBeenCalledWith('analysis_history')
      expect(result).toHaveLength(1)
      expect(result[0].isAI).toBe(true)
    })

    it('should return empty array when no history exists', async () => {
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({
                data: [],
                error: null,
              }),
            }),
          }),
        }),
      })
      ;(supabase!.from as Mock) = mockFrom

      const result = await getHistory(10)
      expect(result).toHaveLength(0)
    })
  })

  describe('getHistoryItem', () => {
    it('should return a specific history item', async () => {
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockDbRow,
                error: null,
              }),
            }),
          }),
        }),
      })
      ;(supabase!.from as Mock) = mockFrom

      const result = await getHistoryItem('test-uuid-1')

      expect(result).not.toBeNull()
      expect(result?.id).toBe('test-uuid-1')
    })

    it('should return null when item not found', async () => {
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: null,
              }),
            }),
          }),
        }),
      })
      ;(supabase!.from as Mock) = mockFrom

      const result = await getHistoryItem('non-existent-id')
      expect(result).toBeNull()
    })
  })

  describe('deleteHistoryItem', () => {
    it('should delete a history item', async () => {
      const mockFrom = vi.fn().mockReturnValue({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              error: null,
            }),
          }),
        }),
      })
      ;(supabase!.from as Mock) = mockFrom

      const result = await deleteHistoryItem('test-uuid-1')

      expect(mockFrom).toHaveBeenCalledWith('analysis_history')
      expect(result).toBe(true)
    })

    it('should return false when delete fails', async () => {
      const mockFrom = vi.fn().mockReturnValue({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              error: new Error('Delete failed'),
            }),
          }),
        }),
      })
      ;(supabase!.from as Mock) = mockFrom

      const result = await deleteHistoryItem('test-uuid-1')
      expect(result).toBe(false)
    })
  })

  describe('clearHistory', () => {
    it('should delete all history items for current session', async () => {
      const mockFrom = vi.fn().mockReturnValue({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            error: null,
          }),
        }),
      })
      ;(supabase!.from as Mock) = mockFrom

      const result = await clearHistory()

      expect(mockFrom).toHaveBeenCalledWith('analysis_history')
      expect(result).toBe(true)
    })
  })
})
