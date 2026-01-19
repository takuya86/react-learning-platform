/**
 * MockDataManager - Centralized Mock Data Management
 *
 * Provides a unified interface for managing all mock data across the application.
 * This singleton class replaces scattered mock storage and functions.
 *
 * ## Benefits
 * - Centralized mock data management
 * - Type-safe API
 * - Easy reset/clear for testing
 * - Consistent interface across features
 *
 * ## Usage
 * ```typescript
 * // Set mock data
 * MockDataManager.getInstance().setAdminEvents(events);
 *
 * // Get mock data
 * const events = MockDataManager.getInstance().getAdminEvents();
 *
 * // Clear specific data
 * MockDataManager.getInstance().clearAdminEvents();
 *
 * // Clear all data
 * MockDataManager.getInstance().clearAll();
 * ```
 */

import type { LearningEvent, UserLearningMetric } from '@/features/metrics';
import type {
  OpenIssue,
  CreatedIssue,
  ImprovementTrackerItem,
} from '@/features/admin/services/githubIssueService';
import type {
  IssueDetails,
  IssueComment,
} from '@/features/admin/services/githubIssueCommentService';

/**
 * MockDataManager Singleton Class
 */
export class MockDataManager {
  private static instance: MockDataManager;

  // Metrics-related mock storage
  private adminEvents: LearningEvent[] = [];
  private adminUserMetrics: UserLearningMetric[] = [];
  private trendEvents: LearningEvent[] = [];
  private growthEvents: LearningEvent[] = [];
  private learningEvents: LearningEvent[] = [];

  // GitHub Issue-related mock storage
  private openIssues: OpenIssue[] = [];
  private closedIssues: OpenIssue[] = [];
  private createdIssues: CreatedIssue[] = [];
  private issueStates: Map<number, 'open' | 'closed'> = new Map();
  private issueLabels: Map<number, string[]> = new Map();
  private trackerItems: ImprovementTrackerItem[] = [];

  // GitHub Comment-related mock storage
  private issueDetails: Map<number, IssueDetails> = new Map();
  private issueComments: Map<number, IssueComment[]> = new Map();
  private commentIdCounter: number = 1;

  private constructor() {}

  /**
   * Get singleton instance
   */
  public static getInstance(): MockDataManager {
    if (!MockDataManager.instance) {
      MockDataManager.instance = new MockDataManager();
    }
    return MockDataManager.instance;
  }

  /**
   * Reset singleton instance (for testing)
   */
  public static resetInstance(): void {
    MockDataManager.instance = new MockDataManager();
  }

  // ==========================================
  // Admin Metrics
  // ==========================================

  public setAdminEvents(events: LearningEvent[]): void {
    this.adminEvents = [...events];
  }

  public getAdminEvents(): LearningEvent[] {
    return [...this.adminEvents];
  }

  public clearAdminEvents(): void {
    this.adminEvents = [];
  }

  public setAdminUserMetrics(metrics: UserLearningMetric[]): void {
    this.adminUserMetrics = [...metrics];
  }

  public getAdminUserMetrics(): UserLearningMetric[] {
    return [...this.adminUserMetrics];
  }

  public clearAdminUserMetrics(): void {
    this.adminUserMetrics = [];
  }

  public clearAdminData(): void {
    this.clearAdminEvents();
    this.clearAdminUserMetrics();
  }

  // ==========================================
  // Trend Events
  // ==========================================

  public setTrendEvents(events: LearningEvent[]): void {
    this.trendEvents = [...events];
  }

  public getTrendEvents(): LearningEvent[] {
    return [...this.trendEvents];
  }

  public clearTrendEvents(): void {
    this.trendEvents = [];
  }

  // ==========================================
  // Growth Events
  // ==========================================

  public setGrowthEvents(events: LearningEvent[]): void {
    this.growthEvents = [...events];
  }

  public getGrowthEvents(): LearningEvent[] {
    return [...this.growthEvents];
  }

  public clearGrowthEvents(): void {
    this.growthEvents = [];
  }

  // ==========================================
  // Learning Events (Heatmap)
  // ==========================================

  public setLearningEvents(events: LearningEvent[]): void {
    this.learningEvents = [...events];
  }

  public getLearningEvents(): LearningEvent[] {
    return [...this.learningEvents];
  }

  public addLearningEvent(event: LearningEvent): void {
    this.learningEvents.push(event);
  }

  public clearLearningEvents(): void {
    this.learningEvents = [];
  }

  // ==========================================
  // GitHub Issues
  // ==========================================

  public setOpenIssues(issues: OpenIssue[]): void {
    this.openIssues = [...issues];
  }

  public getOpenIssues(): OpenIssue[] {
    return [...this.openIssues];
  }

  public clearOpenIssues(): void {
    this.openIssues = [];
  }

  public setClosedIssues(issues: OpenIssue[]): void {
    this.closedIssues = [...issues];
  }

  public getClosedIssues(): OpenIssue[] {
    return [...this.closedIssues];
  }

  public clearClosedIssues(): void {
    this.closedIssues = [];
  }

  public getCreatedIssues(): CreatedIssue[] {
    return [...this.createdIssues];
  }

  public addCreatedIssue(issue: CreatedIssue): void {
    this.createdIssues.push(issue);
  }

  public clearCreatedIssues(): void {
    this.createdIssues = [];
  }

  public setIssueState(issueNumber: number, state: 'open' | 'closed'): void {
    this.issueStates.set(issueNumber, state);

    // Update openIssues and closedIssues accordingly
    if (state === 'closed') {
      const issueIndex = this.openIssues.findIndex((issue) => issue.number === issueNumber);
      if (issueIndex !== -1) {
        const [issue] = this.openIssues.splice(issueIndex, 1);
        this.closedIssues.push(issue);
      }
    } else {
      const issueIndex = this.closedIssues.findIndex((issue) => issue.number === issueNumber);
      if (issueIndex !== -1) {
        const [issue] = this.closedIssues.splice(issueIndex, 1);
        this.openIssues.push(issue);
      }
    }
  }

  public getIssueState(issueNumber: number): 'open' | 'closed' | undefined {
    return this.issueStates.get(issueNumber);
  }

  public clearIssueStates(): void {
    this.issueStates.clear();
  }

  public setIssueLabels(issueNumber: number, labels: string[]): void {
    this.issueLabels.set(issueNumber, [...labels]);
  }

  public getIssueLabels(issueNumber: number): string[] {
    return [...(this.issueLabels.get(issueNumber) || [])];
  }

  public addIssueLabel(issueNumber: number, label: string): void {
    const current = this.issueLabels.get(issueNumber) || [];
    if (!current.includes(label)) {
      this.issueLabels.set(issueNumber, [...current, label]);
    }
  }

  public clearIssueLabels(): void {
    this.issueLabels.clear();
  }

  // ==========================================
  // Improvement Tracker Items
  // ==========================================

  public setTrackerItems(items: ImprovementTrackerItem[]): void {
    this.trackerItems = [...items];
  }

  public getTrackerItems(): ImprovementTrackerItem[] {
    return [...this.trackerItems];
  }

  public clearTrackerItems(): void {
    this.trackerItems = [];
  }

  public clearIssueData(): void {
    this.clearOpenIssues();
    this.clearClosedIssues();
    this.clearCreatedIssues();
    this.clearIssueStates();
    this.clearIssueLabels();
    this.clearTrackerItems();
  }

  // ==========================================
  // GitHub Comments
  // ==========================================

  public setIssueDetails(issueNumber: number, details: IssueDetails): void {
    this.issueDetails.set(issueNumber, details);
  }

  public getIssueDetails(issueNumber: number): IssueDetails | undefined {
    return this.issueDetails.get(issueNumber);
  }

  public clearIssueDetails(): void {
    this.issueDetails.clear();
  }

  public setIssueComments(issueNumber: number, comments: IssueComment[]): void {
    this.issueComments.set(issueNumber, [...comments]);
  }

  public getIssueComments(issueNumber: number): IssueComment[] {
    return [...(this.issueComments.get(issueNumber) || [])];
  }

  public addIssueComment(issueNumber: number, comment: Omit<IssueComment, 'id'>): IssueComment {
    const newComment: IssueComment = {
      id: this.commentIdCounter++,
      ...comment,
    };

    const current = this.issueComments.get(issueNumber) || [];
    this.issueComments.set(issueNumber, [...current, newComment]);

    return newComment;
  }

  public clearIssueComments(): void {
    this.issueComments.clear();
  }

  public resetCommentIdCounter(): void {
    this.commentIdCounter = 1;
  }

  public clearCommentData(): void {
    this.clearIssueDetails();
    this.clearIssueComments();
    this.resetCommentIdCounter();
  }

  // ==========================================
  // Clear All
  // ==========================================

  /**
   * Clear all mock data
   */
  public clearAll(): void {
    this.clearAdminData();
    this.clearTrendEvents();
    this.clearGrowthEvents();
    this.clearLearningEvents();
    this.clearIssueData();
    this.clearCommentData();
  }
}
