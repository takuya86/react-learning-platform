-- User Progress Table
-- Stores learning progress for each authenticated user

CREATE TABLE user_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lessons JSONB NOT NULL DEFAULT '{}',
  completed_quizzes TEXT[] NOT NULL DEFAULT '{}',
  completed_exercises TEXT[] NOT NULL DEFAULT '{}',
  streak INTEGER NOT NULL DEFAULT 0,
  last_study_date DATE,
  study_dates DATE[] NOT NULL DEFAULT '{}',
  quiz_attempts JSONB NOT NULL DEFAULT '[]',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Create index for faster lookups
CREATE INDEX idx_user_progress_user_id ON user_progress(user_id);

-- Enable Row Level Security
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only access their own progress
CREATE POLICY "Users can CRUD own progress" ON user_progress
  FOR ALL USING (auth.uid() = user_id);

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to auto-update updated_at on changes
CREATE TRIGGER update_user_progress_updated_at
  BEFORE UPDATE ON user_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
