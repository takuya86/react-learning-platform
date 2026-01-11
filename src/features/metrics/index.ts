// Services
export {
  type LearningEventType,
  type LearningEvent,
  type LearningMetrics,
  DEFAULT_WEEKLY_TARGET,
  getUTCDateString,
  getWeekStartUTC,
  isSameDay,
  isYesterday,
  calculateStreak,
  calculateWeeklyProgress,
  updateMetricsOnEvent,
  createInitialMetrics,
  recalculateMetrics,
} from './services/metricsService';

export {
  type HeatmapLevel,
  type HeatmapDay,
  getHeatmapLevel,
  generateDateRange,
  getHeatmapData,
  groupByWeek,
} from './services/heatmapService';

export {
  type TrendMode,
  type DailyTrendPoint,
  type WeeklyTrendPoint,
  generateDailyRangeUTC,
  generateWeeklyRangeUTC,
  aggregateByDay,
  aggregateByWeek,
  getTrendData,
  formatDateLabel,
} from './services/trendService';

export {
  type StreakReasonCode,
  type WeeklyReasonCode,
  type StreakExplain,
  type WeeklyGoalExplain,
  type MetricsExplain,
  buildStreakExplain,
  buildWeeklyGoalExplain,
  buildMetricsExplain,
} from './services/metricsExplainService';

export {
  type AdminPeriod,
  type UserLearningMetric,
  type AdminSummary,
  type StreakDistribution,
  type LeaderboardEntry,
  type Leaderboards,
  getDateRangeForPeriod,
  filterEventsByDateRange,
  getActiveUserIds,
  calculateStreakDistribution,
  calculateWeeklyGoalAchievementRate,
  buildAdminSummary,
  buildEventsTrend,
  buildEventsHeatmap,
  buildLeaderboards,
} from './services/adminMetricsService';

export {
  type HabitState,
  type HabitScoreInput,
  type HabitScoreResult,
  buildHabitScore,
  buildHabitScoreDetailed,
  getHabitState,
  countRecentActiveDays,
} from './services/habitScoreService';

export {
  type InterventionType,
  type Intervention,
  type StreakRescueIntervention,
  type WeeklyCatchupIntervention,
  type PositiveIntervention,
  isStreakAtRisk,
  isWeeklyAtRisk,
  buildIntervention,
  hasInterventionCta,
  shouldLogIntervention,
} from './services/interventionService';

export {
  type GrowthInsights,
  type GrowthInsightsInput,
  buildGrowthInsights,
  getLastWeekStartUTC,
  countActiveDaysInWeek,
  countEventsInWeek,
  countLifetimeActiveDays,
  calculateTopFocus,
} from './services/growthInsightsService';

export {
  type FollowUpInput,
  type FollowUpRate,
  type CompletionRate,
  type EffectivenessSummary,
  isOriginEvent,
  isFollowUpEvent,
  calculateFollowUpRate,
  calculateCompletionRate,
  countFollowUpActions,
  getTopFollowUpAction,
  buildEffectivenessSummary,
} from './services/effectivenessService';

export {
  type LessonInfo,
  type LessonRankingRow,
  type LessonRanking,
  type LessonRankingOptions,
  type FollowUpCounts,
  type LessonMetricsData,
  DEFAULT_MIN_SAMPLE,
  DEFAULT_RANKING_LIMIT,
  calculateLessonMetrics,
  buildLessonRanking,
} from './services/lessonEffectivenessRankingService';

export {
  type LessonEffectiveness,
  type HintType,
  type LessonImprovementHint,
  generateLessonHint,
  generateLessonHints,
} from './services/lessonImprovementHintService';

// Constants (for reference and testing)
export {
  HABIT_SCORE_WEIGHTS,
  HABIT_SCORE_THRESHOLDS,
  HABIT_SCORE_NORMALIZATION,
  INTERVENTION_PRIORITY,
  INTERVENTION_CTA_TEXT,
  INTERVENTION_ICONS,
  INTERVENTION_EVENT_TYPE,
  LOGGABLE_INTERVENTION_TYPES,
  INSIGHTS_EVENT_TYPE,
  INSIGHTS_REFERENCE_ID,
  FOLLOW_UP_WINDOW_HOURS,
  FOLLOW_UP_EVENT_TYPES,
  ORIGIN_EVENT_TYPES,
  type FollowUpEventType,
} from './constants';

// Hooks
export { useLearningMetrics, resetMockMetricsState } from './hooks/useLearningMetrics';
export {
  useLearningHeatmap,
  addMockLearningEvent,
  resetMockLearningEvents,
  setMockLearningEvents,
} from './hooks/useLearningHeatmap';
export {
  useLearningTrend,
  setMockTrendEvents,
  resetMockTrendEvents,
} from './hooks/useLearningTrend';
export {
  useAdminMetrics,
  setMockAdminEvents,
  setMockAdminUserMetrics,
  resetMockAdminData,
  type ImprovementTrackerRow,
} from './hooks/useAdminMetrics';
export {
  useGrowthInsights,
  setMockGrowthEvents,
  resetMockGrowthEvents,
} from './hooks/useGrowthInsights';

// Components
export { LearningMetricsCard } from './components/LearningMetricsCard';
export { LearningHeatmap } from './components/LearningHeatmap';
export { LearningTrendChart } from './components/LearningTrendChart';
export { HabitInterventionCard } from './components/HabitInterventionCard';
export { GrowthInsightsCard } from './components/GrowthInsightsCard';
