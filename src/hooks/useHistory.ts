'use client'

import { useState, useEffect, useCallback } from 'react'
import { HistoryItem, HistoryItemInput } from '@/types/history'
import {
  saveAnalysis as saveAnalysisLib,
  getHistory as getHistoryLib,
  getHistoryItem as getHistoryItemLib,
  deleteHistoryItem as deleteHistoryItemLib,
  clearHistory as clearHistoryLib,
} from '@/lib/history'

interface UseHistoryReturn {
  items: HistoryItem[]
  isLoading: boolean
  error: string | null
  saveAnalysis: (input: HistoryItemInput) => Promise<HistoryItem | null>
  getItem: (id: string) => Promise<HistoryItem | null>
  deleteItem: (id: string) => Promise<boolean>
  clearAll: () => Promise<boolean>
  refresh: () => Promise<void>
}

export function useHistory(limit: number = 10): UseHistoryReturn {
  const [items, setItems] = useState<HistoryItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const history = await getHistoryLib(limit)
      setItems(history)
    } catch (err) {
      setError('히스토리를 불러오는데 실패했습니다.')
      console.error('Failed to fetch history:', err)
    } finally {
      setIsLoading(false)
    }
  }, [limit])

  useEffect(() => {
    refresh()
  }, [refresh])

  const saveAnalysis = useCallback(async (input: HistoryItemInput): Promise<HistoryItem | null> => {
    try {
      const saved = await saveAnalysisLib(input)
      if (saved) {
        await refresh()
      }
      return saved
    } catch (err) {
      console.error('Failed to save analysis:', err)
      return null
    }
  }, [refresh])

  const getItem = useCallback(async (id: string): Promise<HistoryItem | null> => {
    try {
      return await getHistoryItemLib(id)
    } catch (err) {
      console.error('Failed to get history item:', err)
      return null
    }
  }, [])

  const deleteItem = useCallback(async (id: string): Promise<boolean> => {
    try {
      const success = await deleteHistoryItemLib(id)
      if (success) {
        setItems(prev => prev.filter(item => item.id !== id))
      }
      return success
    } catch (err) {
      console.error('Failed to delete history item:', err)
      return false
    }
  }, [])

  const clearAll = useCallback(async (): Promise<boolean> => {
    try {
      const success = await clearHistoryLib()
      if (success) {
        setItems([])
      }
      return success
    } catch (err) {
      console.error('Failed to clear history:', err)
      return false
    }
  }, [])

  return {
    items,
    isLoading,
    error,
    saveAnalysis,
    getItem,
    deleteItem,
    clearAll,
    refresh,
  }
}
