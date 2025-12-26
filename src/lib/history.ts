import { supabase, isSupabaseConfigured } from './supabase'
import { getSessionId } from './session'
import {
  HistoryItem,
  HistoryItemInput,
  HistoryDbRow,
  dbRowToHistoryItem,
  historyItemToDbRow,
} from '@/types/history'

const TABLE_NAME = 'analysis_history'

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

  const dbRow = historyItemToDbRow(input, sessionId)

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

  const sessionId = getSessionId()
  if (!sessionId) {
    return []
  }

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: false })
    .limit(limit)

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

  const sessionId = getSessionId()
  if (!sessionId) {
    return null
  }

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('*')
    .eq('id', id)
    .eq('session_id', sessionId)
    .single()

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

  const sessionId = getSessionId()
  if (!sessionId) {
    return false
  }

  const { error } = await supabase
    .from(TABLE_NAME)
    .delete()
    .eq('id', id)
    .eq('session_id', sessionId)

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

  const sessionId = getSessionId()
  if (!sessionId) {
    return false
  }

  const { error } = await supabase
    .from(TABLE_NAME)
    .delete()
    .eq('session_id', sessionId)

  if (error) {
    console.error('Failed to clear history:', error)
    return false
  }

  return true
}
