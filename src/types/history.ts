import { AnalysisResult } from './index'

export interface HistoryItem {
  id: string
  sessionId: string
  userId?: string
  createdAt: string
  imageUrl?: string
  imageThumbnail?: string
  source: 'upload' | 'url'
  sourceUrl?: string
  isAI: boolean
  confidence: number
  riskLevel: 'low' | 'medium' | 'high'
  evidence: string[]
  contentType?: string
  analysisMethod?: string
}

export interface HistoryItemInput {
  imageUrl?: string
  imageThumbnail?: string
  source: 'upload' | 'url'
  sourceUrl?: string
  result: AnalysisResult
}

export interface HistoryDbRow {
  id: string
  session_id: string
  user_id: string | null
  created_at: string
  image_url: string | null
  image_thumbnail: string | null
  source: string
  source_url: string | null
  is_ai: boolean
  confidence: number
  risk_level: string
  evidence: string[] | null
  content_type: string | null
  analysis_method: string | null
}

export function dbRowToHistoryItem(row: HistoryDbRow): HistoryItem {
  return {
    id: row.id,
    sessionId: row.session_id,
    userId: row.user_id || undefined,
    createdAt: row.created_at,
    imageUrl: row.image_url || undefined,
    imageThumbnail: row.image_thumbnail || undefined,
    source: row.source as 'upload' | 'url',
    sourceUrl: row.source_url || undefined,
    isAI: row.is_ai,
    confidence: row.confidence,
    riskLevel: row.risk_level as 'low' | 'medium' | 'high',
    evidence: row.evidence || [],
    contentType: row.content_type || undefined,
    analysisMethod: row.analysis_method || undefined,
  }
}

export function historyItemToDbRow(
  item: HistoryItemInput,
  sessionId: string,
  userId?: string
): Omit<HistoryDbRow, 'id' | 'created_at'> {
  return {
    session_id: sessionId,
    user_id: userId || null,
    image_url: item.imageUrl || null,
    image_thumbnail: item.imageThumbnail || null,
    source: item.source,
    source_url: item.sourceUrl || null,
    is_ai: item.result.isAI,
    confidence: item.result.confidence,
    risk_level: item.result.riskLevel,
    evidence: item.result.evidence,
    content_type: item.result.contentType || null,
    analysis_method: item.result.analysisMethod || null,
  }
}
