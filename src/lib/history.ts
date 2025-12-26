import { supabase, isSupabaseConfigured } from './supabase'
import { createClient } from './supabase/client'
import { getSessionId } from './session'
import {
  HistoryItem,
  HistoryItemInput,
  HistoryDbRow,
  dbRowToHistoryItem,
  historyItemToDbRow,
} from '@/types/history'

const TABLE_NAME = 'analysis_history'

// 현재 로그인한 사용자 ID 가져오기
async function getCurrentUserId(): Promise<string | null> {
  const supabaseClient = createClient()
  if (!supabaseClient) return null

  try {
    const { data: { user } } = await supabaseClient.auth.getUser()
    return user?.id || null
  } catch {
    return null
  }
}

export async function saveAnalysis(input: HistoryItemInput): Promise<HistoryItem | null> {
  if (!isSupabaseConfigured() || !supabase) {
    console.warn('Supabase not configured. History will not be saved.')
    return null
  }

  const sessionId = getSessionId()
  if (!sessionId) {
    console.warn('No session ID available. History will not be saved.')
    return null
  }

  // 로그인 사용자인 경우 userId도 함께 저장
  const userId = await getCurrentUserId()
  const dbRow = historyItemToDbRow(input, sessionId, userId || undefined)

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .insert(dbRow)
    .select()
    .single()

  if (error) {
    console.error('Failed to save analysis:', error)
    return null
  }

  return data ? dbRowToHistoryItem(data as HistoryDbRow) : null
}

export async function getHistory(limit: number = 10): Promise<HistoryItem[]> {
  if (!isSupabaseConfigured() || !supabase) {
    return []
  }

  const userId = await getCurrentUserId()
  const sessionId = getSessionId()

  // 로그인도 안 되어 있고 세션도 없으면 빈 배열
  if (!userId && !sessionId) {
    return []
  }

  let query = supabase
    .from(TABLE_NAME)
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  // 로그인 사용자: user_id 기반 조회
  // 비로그인 사용자: session_id 기반 조회
  if (userId) {
    query = query.eq('user_id', userId)
  } else {
    query = query.eq('session_id', sessionId)
  }

  const { data, error } = await query

  if (error) {
    console.error('Failed to get history:', error)
    return []
  }

  return (data as HistoryDbRow[] || []).map(dbRowToHistoryItem)
}

export async function getHistoryItem(id: string): Promise<HistoryItem | null> {
  if (!isSupabaseConfigured() || !supabase) {
    return null
  }

  const userId = await getCurrentUserId()
  const sessionId = getSessionId()

  if (!userId && !sessionId) {
    return null
  }

  let query = supabase
    .from(TABLE_NAME)
    .select('*')
    .eq('id', id)

  // 로그인 사용자: user_id 기반, 비로그인: session_id 기반
  if (userId) {
    query = query.eq('user_id', userId)
  } else {
    query = query.eq('session_id', sessionId)
  }

  const { data, error } = await query.single()

  if (error) {
    console.error('Failed to get history item:', error)
    return null
  }

  return data ? dbRowToHistoryItem(data as HistoryDbRow) : null
}

export async function deleteHistoryItem(id: string): Promise<boolean> {
  if (!isSupabaseConfigured() || !supabase) {
    return false
  }

  const userId = await getCurrentUserId()
  const sessionId = getSessionId()

  if (!userId && !sessionId) {
    return false
  }

  let query = supabase
    .from(TABLE_NAME)
    .delete()
    .eq('id', id)

  // 로그인 사용자: user_id 기반, 비로그인: session_id 기반
  if (userId) {
    query = query.eq('user_id', userId)
  } else {
    query = query.eq('session_id', sessionId)
  }

  const { error } = await query

  if (error) {
    console.error('Failed to delete history item:', error)
    return false
  }

  return true
}

export async function clearHistory(): Promise<boolean> {
  if (!isSupabaseConfigured() || !supabase) {
    return false
  }

  const userId = await getCurrentUserId()
  const sessionId = getSessionId()

  if (!userId && !sessionId) {
    return false
  }

  let query = supabase
    .from(TABLE_NAME)
    .delete()

  // 로그인 사용자: user_id 기반, 비로그인: session_id 기반
  if (userId) {
    query = query.eq('user_id', userId)
  } else {
    query = query.eq('session_id', sessionId)
  }

  const { error } = await query

  if (error) {
    console.error('Failed to clear history:', error)
    return false
  }

  return true
}
