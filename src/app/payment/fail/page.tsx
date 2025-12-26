'use client'

import { Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { XCircle, Loader2 } from 'lucide-react'

/**
 * 결제 실패 페이지 콘텐츠
 */
function PaymentFailContent() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const errorCode = searchParams.get('code') || 'UNKNOWN_ERROR'
  const errorMessage = searchParams.get('message') || '결제 처리 중 오류가 발생했습니다.'

  // 에러 코드에 따른 사용자 친화적 메시지
  const getDisplayMessage = (code: string, message: string): string => {
    switch (code) {
      case 'PAY_PROCESS_CANCELED':
        return '결제가 취소되었습니다.'
      case 'PAY_PROCESS_ABORTED':
        return '결제가 중단되었습니다.'
      case 'REJECT_CARD_COMPANY':
        return '카드사에서 결제를 거부했습니다.'
      default:
        return message
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
      <div className="w-16 h-16 mx-auto mb-4 bg-red-100 dark:bg-red-500/20 rounded-full flex items-center justify-center">
        <XCircle className="w-8 h-8 text-red-500" />
      </div>

      <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
        결제 실패
      </h1>

      <p className="text-gray-500 dark:text-gray-400 mb-2">
        {getDisplayMessage(errorCode, errorMessage)}
      </p>

      <p className="text-xs text-gray-400 dark:text-gray-500 mb-6">
        오류 코드: {errorCode}
      </p>

      <div className="flex gap-3 justify-center">
        <button
          onClick={() => router.push('/')}
          className="px-6 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
        >
          메인으로
        </button>
        <button
          onClick={() => router.back()}
          className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          다시 시도
        </button>
      </div>
    </div>
  )
}

/**
 * 로딩 폴백
 */
function LoadingFallback() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
      <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-gray-500 animate-spin" />
      </div>
      <p className="text-gray-500 dark:text-gray-400">로딩 중...</p>
    </div>
  )
}

/**
 * 결제 실패 페이지
 * Toss Payments에서 결제 실패/취소 시 리다이렉트되는 페이지
 * URL 파라미터: code, message
 */
export default function PaymentFailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <Suspense fallback={<LoadingFallback />}>
        <PaymentFailContent />
      </Suspense>
    </div>
  )
}
