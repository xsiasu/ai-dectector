'use client'

import { AlertTriangle, Zap } from 'lucide-react'

interface UsageWarningProps {
  remainingCredits: number
  onUpgradeClick: () => void
}

export function UsageWarning({ remainingCredits, onUpgradeClick }: UsageWarningProps) {
  // 2회 이상 남았으면 경고 표시 안 함
  if (remainingCredits > 2) {
    return null
  }

  // 0회면 다른 메시지
  if (remainingCredits === 0) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 p-1 bg-red-100 dark:bg-red-800 rounded-full">
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
          </div>
          <div className="flex-1">
            <h4 className="font-medium text-red-800 dark:text-red-200">
              무료 크레딧을 모두 사용했습니다
            </h4>
            <p className="text-sm text-red-600 dark:text-red-400 mt-1">
              계속 사용하려면 크레딧을 충전해주세요.
            </p>
            <button
              onClick={onUpgradeClick}
              className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <Zap className="w-4 h-4" />
              크레딧 충전하기
            </button>
          </div>
        </div>
      </div>
    )
  }

  // 1~2회 남았을 때
  return (
    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 p-1 bg-amber-100 dark:bg-amber-800 rounded-full">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
        </div>
        <div className="flex-1">
          <h4 className="font-medium text-amber-800 dark:text-amber-200">
            무료 크레딧이 {remainingCredits}회 남았습니다
          </h4>
          <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">
            크레딧을 미리 충전하면 끊김 없이 계속 사용할 수 있습니다.
          </p>
          <button
            onClick={onUpgradeClick}
            className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Zap className="w-4 h-4" />
            크레딧 충전하기
          </button>
        </div>
      </div>
    </div>
  )
}
