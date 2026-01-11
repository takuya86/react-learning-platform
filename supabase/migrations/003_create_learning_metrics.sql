-- Learning Events Table
-- Logs individual learning activities for metrics calculation

CREATE TABLE learning_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('lesson_completed', 'quiz_completed', 'note_updated')),
  event_date DATE NOT NULL,  -- UTC date
  reference_id TEXT,  -- lesson_id, quiz_id, or note_id
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for faster lookups
CREATE INDEX idx_learning_events_user_id ON learning_events(user_id);
CREATE INDEX idx_learning_events_user_date ON learning_events(user_id, event_date);

-- Enable Row Level Security
ALTER TABLE learning_events ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only access their own events
CREATE POLICY "Users can CRUD own events" ON learning_events
  FOR ALL USING (auth.uid() = user_id);


-- User Learning Metrics Table
-- Aggregated metrics for display (calculated client-side, stored for quick access)

CREATE TABLE user_learning_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  streak INTEGER NOT NULL DEFAULT 0,
  last_activity_date DATE,  -- UTC date
  weekly_goal_type TEXT NOT NULL DEFAULT 'days' CHECK (weekly_goal_type IN ('days')),
  weekly_goal_target INTEGER NOT NULL DEFAULT 5,
  weekly_goal_progress INTEGER NOT NULL DEFAULT 0,
  week_start_date DATE,  -- UTC Monday of current week
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Create index for faster lookups
CREATE INDEX idx_user_learning_metrics_user_id ON user_learning_metrics(user_id);

-- Enable Row Level Security
ALTER TABLE user_learning_metrics ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only access their own metrics
CREATE POLICY "Users can CRUD own metrics" ON user_learning_metrics
  FOR ALL USING (auth.uid() = user_id);

-- Trigger to auto-update updated_at on changes
CREATE TRIGGER update_user_learning_metrics_updated_at
  BEFORE UPDATE ON user_learning_metrics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
