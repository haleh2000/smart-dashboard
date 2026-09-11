import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { UserQuery } from '../../domain/AdminRepositories';
import type { IntegrationId, ScenarioInput, SystemSettings } from '../../domain/settings';
import type { StaffUserInput } from '../../domain/staffUser';
import { useSettingsRepository, useUserRepository } from '../adminServices';

export const userKeys = {
  all: ['admin', 'users'] as const,
  list: (query: UserQuery) => [...userKeys.all, 'list', query] as const,
  countByRole: () => [...userKeys.all, 'countByRole'] as const,
};

export const settingsKeys = {
  all: ['admin', 'settings'] as const,
  settings: () => [...settingsKeys.all, 'system'] as const,
  integrations: () => [...settingsKeys.all, 'integrations'] as const,
  scenarios: () => [...settingsKeys.all, 'scenarios'] as const,
};

export function useUsers(query: UserQuery) {
  const repository = useUserRepository();
  return useQuery({
    queryKey: userKeys.list(query),
    queryFn: () => repository.list(query),
    placeholderData: keepPreviousData,
  });
}

export function useRoleCounts() {
  const repository = useUserRepository();
  return useQuery({ queryKey: userKeys.countByRole(), queryFn: () => repository.countByRole() });
}

/** Creates (no id) or updates (with id) a user. */
export function useSaveUser() {
  const repository = useUserRepository();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id?: string; input: StaffUserInput }) =>
      id ? repository.update(id, input) : repository.create(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: userKeys.all }),
  });
}

export function useSetUserActive() {
  const repository = useUserRepository();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      repository.setActive(id, active),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: userKeys.all }),
  });
}

export function useSystemSettings() {
  const repository = useSettingsRepository();
  return useQuery({ queryKey: settingsKeys.settings(), queryFn: () => repository.getSettings() });
}

export function useUpdateSettings() {
  const repository = useSettingsRepository();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (settings: SystemSettings) => repository.updateSettings(settings),
    onSuccess: (saved) => queryClient.setQueryData(settingsKeys.settings(), saved),
  });
}

export function useIntegrations() {
  const repository = useSettingsRepository();
  return useQuery({
    queryKey: settingsKeys.integrations(),
    queryFn: () => repository.getIntegrations(),
  });
}

export function useCheckIntegration() {
  const repository = useSettingsRepository();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: IntegrationId) => repository.checkIntegration(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: settingsKeys.integrations() }),
  });
}

export function useSetIntegrationEnabled() {
  const repository = useSettingsRepository();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, enabled }: { id: IntegrationId; enabled: boolean }) =>
      repository.setIntegrationEnabled(id, enabled),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: settingsKeys.integrations() }),
  });
}

export function useScenarios() {
  const repository = useSettingsRepository();
  return useQuery({ queryKey: settingsKeys.scenarios(), queryFn: () => repository.getScenarios() });
}

export function useCreateScenario() {
  const repository = useSettingsRepository();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ScenarioInput) => repository.createScenario(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: settingsKeys.scenarios() }),
  });
}

export function useSetScenarioActive() {
  const repository = useSettingsRepository();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      repository.setScenarioActive(id, active),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: settingsKeys.scenarios() }),
  });
}
