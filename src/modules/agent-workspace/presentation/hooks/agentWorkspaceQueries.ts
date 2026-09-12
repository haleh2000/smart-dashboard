import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCurrentUser } from '@/modules/auth';
import { useAgentWorkspaceRepository } from '../agentWorkspaceServices';
import type { AgentStatus } from '../../domain';

export const agentWorkspaceKeys = {
  all: ['agentWorkspace'] as const,
  data: (agentId: string) => [...agentWorkspaceKeys.all, 'data', agentId] as const,
};

export function useAgentWorkspaceData() {
  const { id: agentId } = useCurrentUser();
  const repo = useAgentWorkspaceRepository();

  return useQuery({
    queryKey: agentWorkspaceKeys.data(agentId),
    queryFn: () => repo.getWorkspaceData(agentId),
    refetchInterval: 30_000,
    staleTime: 10_000,
  });
}

export function useUpdateAgentStatus() {
  const { id: agentId } = useCurrentUser();
  const repo = useAgentWorkspaceRepository();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (status: AgentStatus) => repo.updateAgentStatus(agentId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: agentWorkspaceKeys.all });
    },
  });
}