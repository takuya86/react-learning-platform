// Services
export {
  type DailyEventDisplay,
  type DailyEventsResult,
  getEventTypeDisplayTitle,
  getEventTypeIcon,
  getEventLinkPath,
  convertToDisplayEvent,
  buildDailyEventsResult,
  formatDateForDisplay,
  getDayOfWeekJapanese,
} from './services/dailyEventsService';

export {
  type StreakAlertType,
  type StreakAlertInfo,
  buildStreakAlert,
} from './services/streakAlertService';

export {
  type CountdownType,
  type WeeklyCountdownInfo,
  getRemainingDaysInWeek,
  determineCountdownType,
  buildWeeklyCountdown,
} from './services/weeklyCountdownService';

export {
  type TodayActionRecommendation,
  selectBestLesson,
  determineUrgency,
  generateHeadline,
  generateReason,
  buildTodayActionRecommendation,
} from './services/actionRecommendationService';

// Hooks
export { useDailyEvents, setMockDailyEvents, resetMockDailyEvents } from './hooks/useDailyEvents';

// Components
export { HeatmapDrilldownModal } from './components/HeatmapDrilldownModal';
export { ClickableHeatmap } from './components/ClickableHeatmap';
export { StreakAlert } from './components/StreakAlert';
export { WeeklyCountdown } from './components/WeeklyCountdown';
export { TodayActionCard } from './components/TodayActionCard';
