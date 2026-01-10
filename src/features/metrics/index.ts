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

// Hooks
export { useLearningMetrics, resetMockMetricsState } from './hooks/useLearningMetrics';

// Components
export { LearningMetricsCard } from './components/LearningMetricsCard';
