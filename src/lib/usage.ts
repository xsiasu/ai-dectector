import { UsageData, FREE_USAGE_LIMIT } from '@/types/usage'

const STORAGE_KEY = 'ai-detector-usage'

function getDefaultUsageData(): UsageData {
  return {
    freeUsageCount: 0,
    paidCredits: 0,
    lastUsedDate: new Date().toISOString().split('T')[0],
    totalAnalyzed: 0,
  }
}

export function getUsageData(): UsageData {
  if (typeof window === 'undefined') {
    return getDefaultUsageData()
  }

  const stored = localStorage.getItem(STORAGE_KEY)
  if (!stored) {
    return getDefaultUsageData()
  }

  try {
    return JSON.parse(stored) as UsageData
  } catch {
    return getDefaultUsageData()
  }
}

function saveUsageData(data: UsageData): void {
  if (typeof window === 'undefined') {
    return
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export function incrementUsage(): boolean {
  const data = getUsageData()
  const today = new Date().toISOString().split('T')[0]

  if (data.freeUsageCount < FREE_USAGE_LIMIT) {
    data.freeUsageCount += 1
  } else if (data.paidCredits > 0) {
    data.paidCredits -= 1
  } else {
    return false
  }

  data.totalAnalyzed += 1
  data.lastUsedDate = today
  saveUsageData(data)
  return true
}

export function hasRemainingCredits(): boolean {
  const data = getUsageData()
  return data.freeUsageCount < FREE_USAGE_LIMIT || data.paidCredits > 0
}

export function addCredits(amount: number): void {
  const data = getUsageData()
  data.paidCredits += amount
  saveUsageData(data)
}

export function getCredits(): number {
  const data = getUsageData()
  const remainingFree = Math.max(0, FREE_USAGE_LIMIT - data.freeUsageCount)
  return remainingFree + data.paidCredits
}

export function canUseService(): boolean {
  return hasRemainingCredits()
}

export function resetUsage(): void {
  saveUsageData(getDefaultUsageData())
}

export function getRemainingFreeUsage(): number {
  const data = getUsageData()
  return Math.max(0, FREE_USAGE_LIMIT - data.freeUsageCount)
}

export function getPaidCredits(): number {
  const data = getUsageData()
  return data.paidCredits
}
