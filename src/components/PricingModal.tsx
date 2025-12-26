'use client'

import { useState } from 'react'
import { CREDIT_PACKAGES, CreditPackage, FREE_USAGE_LIMIT } from '@/types/usage'
import { X, CreditCard, Zap, Check, Loader2 } from 'lucide-react'
import { generateOrderId } from '@/lib/toss'

interface PricingModalProps {
  isOpen: boolean
  onClose: () => void
  remainingFreeUsage: number
  paidCredits: number
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
    maximumFractionDigits: 0,
  }).format(price)
}

function getPricePerCredit(pkg: CreditPackage): number {
  return pkg.price / pkg.credits
}

export function PricingModal({
  isOpen,
  onClose,
  remainingFreeUsage,
  paidCredits
}: PricingModalProps) {
  const [selectedPackage, setSelectedPackage] = useState<CreditPackage | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const handlePurchase = async () => {
    if (!selectedPackage) return

    setIsProcessing(true)
    setError(null)

    try {
      const orderId = generateOrderId()

      // Checkout API 호출
      const response = await fetch('/api/payments/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          orderName: selectedPackage.label,
          amount: selectedPackage.price,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '결제 요청에 실패했습니다.')
      }

      // Toss 결제 페이지로 리다이렉트
      window.location.href = data.checkoutUrl
    } catch (err) {
      console.error('결제 요청 실패:', err)
      setError(err instanceof Error ? err.message : '결제 처리 중 오류가 발생했습니다.')
      setIsProcessing(false)
    }
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={handleBackdropClick}
    >
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="relative px-6 pt-6 pb-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1 hover:bg-white/20 rounded-full transition-colors"
            aria-label="닫기"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">크레딧 충전</h2>
              <p className="text-sm text-white/80">더 많은 이미지를 분석하세요</p>
            </div>
          </div>
        </div>

        {/* Current Status */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">남은 무료 크레딧</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {remainingFreeUsage} / {FREE_USAGE_LIMIT}
            </span>
          </div>
          <div className="flex justify-between text-sm mt-1">
            <span className="text-gray-500 dark:text-gray-400">보유 유료 크레딧</span>
            <span className="font-medium text-gray-900 dark:text-white">{paidCredits}</span>
          </div>
          <div className="flex justify-between text-sm mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
            <span className="font-semibold text-gray-700 dark:text-gray-300">총 사용 가능 크레딧</span>
            <span className="font-bold text-blue-600 dark:text-blue-400">{remainingFreeUsage + paidCredits}</span>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="px-6 py-3 bg-red-50 dark:bg-red-500/10 border-b border-red-200 dark:border-red-500/20">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Success Message */}
        {showSuccess && (
          <div className="px-6 py-8 flex flex-col items-center justify-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-500/20 rounded-full flex items-center justify-center mb-4">
              <Check className="w-8 h-8 text-green-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">충전 완료!</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {selectedPackage?.credits}개 크레딧이 추가되었습니다
            </p>
          </div>
        )}

        {/* Package Selection */}
        {!showSuccess && (
          <>
            <div className="px-6 py-4 space-y-3">
              {CREDIT_PACKAGES.map((pkg) => {
                const isSelected = selectedPackage?.credits === pkg.credits
                const pricePerCredit = getPricePerCredit(pkg)
                const isPopular = pkg.credits === 50

                return (
                  <button
                    key={pkg.credits}
                    onClick={() => setSelectedPackage(pkg)}
                    className={`relative w-full p-4 rounded-xl border-2 transition-all duration-200 ${isSelected
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                  >
                    {isPopular && (
                      <span className="absolute -top-2 left-4 px-2 py-0.5 bg-gradient-to-r from-orange-400 to-pink-500 text-white text-xs font-medium rounded-full">
                        인기
                      </span>
                    )}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center ${isSelected
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                            }`}
                        >
                          <Zap className="w-5 h-5" />
                        </div>
                        <div className="text-left">
                          <div className="font-semibold text-gray-900 dark:text-white">
                            {pkg.label}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            회당 {formatPrice(pricePerCredit)}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-gray-900 dark:text-white">
                          {formatPrice(pkg.price)}
                        </div>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Purchase Button */}
            <div className="px-6 pb-6">
              <button
                onClick={handlePurchase}
                disabled={!selectedPackage || isProcessing}
                className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    결제 페이지 이동 중...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5" />
                    {selectedPackage
                      ? `${formatPrice(selectedPackage.price)} 결제하기`
                      : '패키지를 선택하세요'}
                  </>
                )}
              </button>
              <p className="text-xs text-center text-gray-400 dark:text-gray-500 mt-3">
                결제는 Toss Payments를 통해 안전하게 처리됩니다
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
