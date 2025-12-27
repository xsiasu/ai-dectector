export interface UsageData {
  freeUsageCount: number
  paidCredits: number
  lastUsedDate: string
  totalAnalyzed: number
}

export const FREE_USAGE_LIMIT = 3

export const CREDIT_PACKAGES = [
  { credits: 10, price: 1000, label: '10회권' },
  { credits: 50, price: 4000, label: '50회권' },
  { credits: 100, price: 7000, label: '100회권' },
] as const

export type CreditPackage = typeof CREDIT_PACKAGES[number]
