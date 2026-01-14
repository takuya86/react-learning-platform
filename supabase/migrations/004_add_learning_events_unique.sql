-- Add UNIQUE constraint to learning_events for idempotent event recording
-- Prevents duplicate events for the same user/type/entity/day (UTC)
--
-- 仕様:
-- - 同一ユーザー・同一イベント種別・同一対象・同一日（UTC）は1件のみ
-- - 多タブ・多端末・リトライ・連打でも重複しない
-- - クライアント側でupsert + onConflictIgnoreで書き込む

-- reference_id が NULL の場合も考慮し、COALESCE で空文字に変換して一意性を担保
-- (NULL同士は UNIQUE 制約で同一とみなされないため)

-- UNIQUE制約を追加
-- PostgreSQLではCOALESCEを含むUNIQUE制約は直接作れないため、
-- reference_id を NOT NULL DEFAULT '' に変更するか、部分インデックスを使う
-- ここでは安全のため、reference_id に DEFAULT '' を設定し NOT NULL にする

-- Step 1: 既存の NULL を空文字に更新（既存データがある場合）
UPDATE learning_events SET reference_id = '' WHERE reference_id IS NULL;

-- Step 2: NOT NULL制約と DEFAULT を追加
ALTER TABLE learning_events
  ALTER COLUMN reference_id SET NOT NULL,
  ALTER COLUMN reference_id SET DEFAULT '';

-- Step 3: UNIQUE制約を追加
-- 同一ユーザー・同一イベント種別・同一対象・同一日は1件のみ
CREATE UNIQUE INDEX idx_learning_events_unique_daily
  ON learning_events (user_id, event_type, reference_id, event_date);

-- Note: 既存のインデックスはそのまま維持
-- idx_learning_events_user_id (user_id)
-- idx_learning_events_user_date (user_id, event_date)
