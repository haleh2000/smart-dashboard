// Public API of the agent-workspace module. Other code imports from "@/modules/agent-workspace" only.
export type {
  AgentWorkspaceRepository,
  AgentWorkspaceData,
  AgentShiftState,
  NextAction,
  AgentWorkQueueItem,
  PersonalShiftSummary,
  AgentStatus,
} from './domain';
export { MockAgentWorkspaceRepository } from './infrastructure';
export { AgentWorkspaceView } from './presentation';
export { AgentWorkspaceRepositoryProvider } from './presentation/agentWorkspaceServices';