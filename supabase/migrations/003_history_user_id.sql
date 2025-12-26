-- History Updates: analysis_history에 user_id 연결
-- Supabase Dashboard > SQL Editor에서 실행

-- 1. analysis_history에 user_id 컬럼 추가
ALTER TABLE analysis_history
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- user_id 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_history_user_id ON analysis_history(user_id);

-- 2. RLS 정책 추가 (로그인 사용자는 자신의 기록만 접근)
-- 기존 정책이 있을 수 있으므로 DROP IF EXISTS 후 생성
DROP POLICY IF EXISTS "Users can view own history" ON analysis_history;
CREATE POLICY "Users can view own history" ON analysis_history
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "Users can delete own history" ON analysis_history;
CREATE POLICY "Users can delete own history" ON analysis_history
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- 3. 기록 병합 함수 (session_id 기반 기록을 user_id에 연결)
CREATE OR REPLACE FUNCTION merge_history_to_user(
  p_session_id TEXT,
  p_user_id UUID
) RETURNS VOID AS $$
BEGIN
  -- session_id 기반 기록에 user_id 연결
  UPDATE analysis_history SET
    user_id = p_user_id
  WHERE session_id = p_session_id AND user_id IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
