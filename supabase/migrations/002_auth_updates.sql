-- Auth Updates: user_id 연결 및 결제 내역 테이블
-- Supabase Dashboard > SQL Editor에서 실행

-- 1. usage_log에 user_id 컬럼 추가 (기존 테이블 수정)
ALTER TABLE usage_log
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- user_id 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_usage_user_id ON usage_log(user_id);

-- 2. 결제 내역 테이블 생성
CREATE TABLE IF NOT EXISTS payment_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount INT NOT NULL,
  credits INT NOT NULL,
  package_name TEXT,
  status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 결제 내역 인덱스
CREATE INDEX IF NOT EXISTS idx_payment_user_id ON payment_history(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_created_at ON payment_history(created_at DESC);

-- 3. RLS 정책 설정

-- payment_history RLS 활성화
ALTER TABLE payment_history ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 결제 내역만 조회 가능
CREATE POLICY "Users can view own payments" ON payment_history
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- 서버(service_role)만 결제 내역 생성 가능
CREATE POLICY "Service role can insert payments" ON payment_history
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- usage_log RLS 정책 업데이트 (기존 정책 유지하면서 추가)
-- 로그인한 사용자는 자신의 usage_log만 조회 가능
CREATE POLICY "Users can view own usage" ON usage_log
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR user_id IS NULL);

-- 4. 사용량 병합 함수 (IP 기반 → 사용자 계정)
CREATE OR REPLACE FUNCTION merge_usage_to_user(
  p_ip_hash TEXT,
  p_user_id UUID
) RETURNS VOID AS $$
DECLARE
  v_ip_record RECORD;
  v_user_record RECORD;
BEGIN
  -- IP 해시로 기존 레코드 조회
  SELECT * INTO v_ip_record FROM usage_log WHERE ip_hash = p_ip_hash AND user_id IS NULL;

  -- IP 레코드가 없으면 종료
  IF NOT FOUND THEN
    RETURN;
  END IF;

  -- 사용자 ID로 기존 레코드 조회
  SELECT * INTO v_user_record FROM usage_log WHERE user_id = p_user_id;

  IF FOUND THEN
    -- 사용자 레코드가 있으면 크레딧 합산
    UPDATE usage_log SET
      paid_credits = v_user_record.paid_credits + v_ip_record.paid_credits,
      usage_count = GREATEST(v_user_record.usage_count, v_ip_record.usage_count),
      updated_at = NOW()
    WHERE user_id = p_user_id;

    -- IP 기반 레코드 삭제
    DELETE FROM usage_log WHERE ip_hash = p_ip_hash AND user_id IS NULL;
  ELSE
    -- 사용자 레코드가 없으면 IP 레코드에 user_id 연결
    UPDATE usage_log SET
      user_id = p_user_id,
      updated_at = NOW()
    WHERE ip_hash = p_ip_hash AND user_id IS NULL;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
