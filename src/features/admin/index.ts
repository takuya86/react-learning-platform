export { triggerLessonWorkflow, checkExistingLessonPR } from './services/githubService';
export {
  createIssue,
  isDuplicateIssue,
  listOpenIssuesByLesson,
  listAllOpenImprovementIssues,
  canCreateIssue,
  setMockOpenIssues,
  getMockCreatedIssues,
  resetMockIssueData,
  type CreateIssueParams,
  type CreatedIssue,
  type OpenIssue,
  type IssueResult,
  type ImprovementTrackerItem,
} from './services/githubIssueService';
export {
  getIssueDetails,
  listIssueComments,
  createIssueComment,
  hasEvaluationComment,
  buildEvaluationMarker,
  setMockIssueDetails,
  setMockIssueComments,
  getMockIssueComments,
  resetMockCommentData,
  type IssueDetails,
  type IssueComment,
  type CommentResult,
} from './services/githubIssueCommentService';
export { useGitHubWorkflow } from './hooks/useGitHubWorkflow';
export { useLessonImprovementIssue } from './hooks/useLessonImprovementIssue';
export { GeneratePRButton } from './components/GeneratePRButton';
export { CreateIssueButton } from './components/CreateIssueButton';
