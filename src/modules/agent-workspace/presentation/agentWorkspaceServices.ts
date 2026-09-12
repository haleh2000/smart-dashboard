import { createServiceContext } from '@/shared/di/createServiceContext';
import type { AgentWorkspaceRepository } from '../domain';

export const [AgentWorkspaceRepositoryProvider, useAgentWorkspaceRepository] =
  createServiceContext<AgentWorkspaceRepository>('AgentWorkspaceRepository');