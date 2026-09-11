import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Permission } from '@/modules/auth';
import type { UserQuery } from '../../domain/AdminRepositories';
import { togglePermission, type RoleDefinition, type RoleInput } from '../../domain/roleDefinition';
import type { IntegrationId, ScenarioInput, SystemSettings } from '../../domain/settings';
import type { StaffUserInput } from '../../domain/staffUser';
import { useRoleRepository, useSettingsRepository, useUserRepository } from '../adminServices';

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

export const roleKeys = {
  all: ['admin', 'roles'] as const,
  list: () => [...roleKeys.all, 'list'] as const,
};

export function useRoles() {
  const repository = useRoleRepository();
  return useQuery({ queryKey: roleKeys.list(), queryFn: () => repository.list() });
}

/** Creates (no id) or updates (with id) a role. */
export function useSaveRole() {
  const repository = useRoleRepository();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id?: string; input: RoleInput }) =>
      id ? repository.update(id, input) : repository.create(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: roleKeys.all }),
  });
}

/** One matrix cell: flips a permission optimistically and rolls back on failure. */
export function useToggleRolePermission() {
  const repository = useRoleRepository();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ role, permission }: { role: RoleDefinition; permission: Permission }) =>
      repository.update(role.id, {
        name: role.name,
        description: role.description,
        baseRole: role.baseRole,
        permissions: togglePermission(role, permission),
      }),
    onMutate: async ({ role, permission }) => {
      await queryClient.cancelQueries({ queryKey: roleKeys.list() });
      const previous = queryClient.getQueryData<RoleDefinition[]>(roleKeys.list());
      queryClient.setQueryData<RoleDefinition[]>(roleKeys.list(), (roles) =>
        roles?.map((r) =>
          r.id === role.id ? { ...r, permissions: togglePermission(r, permission) } : r,
        ),
      );
      return { previous };
    },
    onError: (_error, _vars, context) =>
      context?.previous && queryClient.setQueryData(roleKeys.list(), context.previous),
    onSettled: () => queryClient.invalidateQueries({ queryKey: roleKeys.all }),
  });
}

export function useRemoveRole() {
  const repository = useRoleRepository();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => repository.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: roleKeys.all }),
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
