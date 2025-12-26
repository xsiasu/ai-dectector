'use client'

import { useState } from 'react'
import { HistoryItem } from '@/types/history'
import { HistoryCard } from './HistoryCard'
import { useHistory } from '@/hooks/useHistory'
import { History, Trash2, RefreshCw, Loader2 } from 'lucide-react'

interface HistoryListProps {
  onItemClick?: (item: HistoryItem) => void
}

export function HistoryList({ onItemClick }: HistoryListProps) {
  const { items, isLoading, error, deleteItem, clearAll, refresh } = useHistory(10)
  const [showConfirmClear, setShowConfirmClear] = useState(false)
  const [isClearing, setIsClearing] = useState(false)

  const handleDelete = async (id: string) => {
    await deleteItem(id)
  }

  const handleClearAll = async () => {
    setIsClearing(true)
    await clearAll()
    setIsClearing(false)
    setShowConfirmClear(false)
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-400">
        <Loader2 className="w-8 h-8 animate-spin mb-3" />
        <p className="text-sm">히스토리 불러오는 중...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-400">
        <p className="text-sm text-red-400 mb-4">{error}</p>
        <button
          onClick={() => refresh()}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 text-blue-400 rounded-lg hover:bg-blue-500/20 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          다시 시도
        </button>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-400">
        <History className="w-12 h-12 mb-4 opacity-50" />
        <p className="text-sm">분석 기록이 없습니다</p>
        <p className="text-xs mt-1 opacity-75">이미지를 분석하면 여기에 기록됩니다</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <History className="w-5 h-5" />
          최근 분석 기록
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => refresh()}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            aria-label="새로고침"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowConfirmClear(true)}
            className="p-2 text-gray-400 hover:text-red-500 transition-colors"
            aria-label="전체 삭제"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* History Items */}
      <div className="space-y-3">
        {items.map((item) => (
          <HistoryCard
            key={item.id}
            item={item}
            onClick={onItemClick}
            onDelete={handleDelete}
          />
        ))}
      </div>

      {/* Clear Confirmation Dialog */}
      {showConfirmClear && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-sm mx-4 shadow-2xl">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              전체 기록 삭제
            </h4>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              모든 분석 기록이 삭제됩니다. 이 작업은 되돌릴 수 없습니다.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmClear(false)}
                className="flex-1 px-4 py-2 text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleClearAll}
                disabled={isClearing}
                className="flex-1 px-4 py-2 text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isClearing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    삭제 중...
                  </>
                ) : (
                  '삭제'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
