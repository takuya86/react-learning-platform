-- User Notes Table
-- Stores markdown notes for each lesson per user

CREATE TABLE user_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id TEXT NOT NULL,
  markdown TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, lesson_id)
);

-- Create indexes for faster lookups
CREATE INDEX idx_user_notes_user_id ON user_notes(user_id);
CREATE INDEX idx_user_notes_lesson_id ON user_notes(lesson_id);
CREATE INDEX idx_user_notes_user_lesson ON user_notes(user_id, lesson_id);

-- Enable Row Level Security
ALTER TABLE user_notes ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only access their own notes
CREATE POLICY "Users can CRUD own notes" ON user_notes
  FOR ALL USING (auth.uid() = user_id);

-- Trigger to auto-update updated_at on changes
CREATE TRIGGER update_user_notes_updated_at
  BEFORE UPDATE ON user_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
