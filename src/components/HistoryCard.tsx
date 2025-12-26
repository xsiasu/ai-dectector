'use client'

import { HistoryItem } from '@/types/history'
import { Trash2, ExternalLink, Clock, AlertTriangle, CheckCircle, AlertCircle } from 'lucide-react'

interface HistoryCardProps {
  item: HistoryItem
  onClick?: (item: HistoryItem) => void
  onDelete?: (id: string) => void
}

function getRiskColor(riskLevel: string): string {
  switch (riskLevel) {
    case 'high':
      return 'text-red-500 bg-red-500/10'
    case 'medium':
      return 'text-yellow-500 bg-yellow-500/10'
    case 'low':
      return 'text-green-500 bg-green-500/10'
    default:
      return 'text-gray-500 bg-gray-500/10'
  }
}

function getRiskIcon(riskLevel: string) {
  switch (riskLevel) {
    case 'high':
      return <AlertTriangle className="w-4 h-4" />
    case 'medium':
      return <AlertCircle className="w-4 h-4" />
    case 'low':
      return <CheckCircle className="w-4 h-4" />
    default:
      return null
  }
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diff = now.getTime() - date.getTime()

  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return '방금 전'
  if (minutes < 60) return `${minutes}분 전`
  if (hours < 24) return `${hours}시간 전`
  if (days < 7) return `${days}일 전`

  return date.toLocaleDateString('ko-KR', {
    month: 'short',
    day: 'numeric',
  })
}

export function HistoryCard({ item, onClick, onDelete }: HistoryCardProps) {
  const handleClick = () => {
    onClick?.(item)
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    onDelete?.(item.id)
  }

  return (
    <div
      className="group relative bg-white/5 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200/10 dark:border-gray-700/50 rounded-xl p-4 cursor-pointer hover:bg-white/10 dark:hover:bg-gray-700/50 transition-all duration-200"
      onClick={handleClick}
    >
      <div className="flex items-start gap-4">
        {/* Thumbnail */}
        <div className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700">
          {item.imageThumbnail ? (
            <img
              src={item.imageThumbnail}
              alt="분석 이미지"
              className="w-full h-full object-cover"
            />
          ) : item.imageUrl ? (
            <img
              src={item.imageUrl}
              alt="분석 이미지"
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none'
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <ExternalLink className="w-6 h-6" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Risk Level Badge */}
          <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${getRiskColor(item.riskLevel)}`}>
            {getRiskIcon(item.riskLevel)}
            <span>
              {item.isAI ? 'AI 생성' : '실제 이미지'} · {item.confidence}%
            </span>
          </div>

          {/* Source */}
          <div className="mt-2 text-sm text-gray-500 dark:text-gray-400 truncate">
            {item.source === 'url' && item.sourceUrl ? (
              <span className="flex items-center gap-1">
                <ExternalLink className="w-3 h-3" />
                {new URL(item.sourceUrl).hostname}
              </span>
            ) : (
              <span>파일 업로드</span>
            )}
          </div>

          {/* Date */}
          <div className="mt-1 flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
            <Clock className="w-3 h-3" />
            {formatDate(item.createdAt)}
          </div>
        </div>

        {/* Delete Button */}
        <button
          onClick={handleDelete}
          className="flex-shrink-0 opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-red-500 transition-all duration-200"
          aria-label="삭제"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Evidence Preview */}
      {item.evidence.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-200/10 dark:border-gray-700/50">
          <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
            {item.evidence[0]}
          </p>
        </div>
      )}
    </div>
  )
}
