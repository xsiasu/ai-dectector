'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Check, Loader2, AlertCircle } from 'lucide-react'

/**
 * 결제 성공 페이지 콘텐츠
 */
function PaymentSuccessContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [errorMessage, setErrorMessage] = useState<string>('')
  const [credits, setCredits] = useState<number>(0)

  useEffect(() => {
    const confirmPayment = async () => {
      const paymentKey = searchParams.get('paymentKey')
      const orderId = searchParams.get('orderId')
      const amount = searchParams.get('amount')

      if (!paymentKey || !orderId || !amount) {
        setStatus('error')
        setErrorMessage('결제 정보가 올바르지 않습니다.')
        return
      }

      try {
        const response = await fetch('/api/payments/confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            paymentKey,
            orderId,
            amount: Number(amount),
          }),
        })

        const data = await response.json()

        if (!response.ok) {
          setStatus('error')
          setErrorMessage(data.error || '결제 확인에 실패했습니다.')
          return
        }

        // 크레딧 계산 (금액 기준)
        const amountNum = Number(amount)
        let purchasedCredits = 0
        if (amountNum === 1000) purchasedCredits = 10
        else if (amountNum === 4000) purchasedCredits = 50
        else if (amountNum === 7000) purchasedCredits = 100

        setCredits(purchasedCredits)
        setStatus('success')

        // 3초 후 메인 페이지로 이동
        setTimeout(() => {
          router.push('/')
        }, 3000)
      } catch {
        setStatus('error')
        setErrorMessage('결제 처리 중 오류가 발생했습니다.')
      }
    }

    confirmPayment()
  }, [searchParams, router])

  if (status === 'loading') {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 dark:bg-blue-500/20 rounded-full flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        </div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          결제 처리 중...
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          잠시만 기다려 주세요.
        </p>
      </div>
    )
  }

  if (status === 'success') {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-green-100 dark:bg-green-500/20 rounded-full flex items-center justify-center">
          <Check className="w-8 h-8 text-green-500" />
        </div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          결제 완료!
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mb-4">
          {credits}개 크레딧이 충전되었습니다.
        </p>
        <p className="text-sm text-gray-400 dark:text-gray-500">
          잠시 후 메인 페이지로 이동합니다...
        </p>
      </div>
    )
  }

  // status === 'error'
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
      <div className="w-16 h-16 mx-auto mb-4 bg-red-100 dark:bg-red-500/20 rounded-full flex items-center justify-center">
        <AlertCircle className="w-8 h-8 text-red-500" />
      </div>
      <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
        결제 실패
      </h1>
      <p className="text-gray-500 dark:text-gray-400 mb-4">
        {errorMessage}
      </p>
      <button
        onClick={() => router.push('/')}
        className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
      >
        메인으로 돌아가기
      </button>
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
 * 결제 성공 페이지
 * Toss Payments에서 결제 완료 후 리다이렉트되는 페이지
 * URL 파라미터: paymentKey, orderId, amount
 */
export default function PaymentSuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <Suspense fallback={<LoadingFallback />}>
        <PaymentSuccessContent />
      </Suspense>
    </div>
  )
}
