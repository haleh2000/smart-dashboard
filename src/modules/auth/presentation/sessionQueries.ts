import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Credentials } from '../domain/credentials';
import { useAuthRepository } from './authServices';

const currentUserKey = ['auth', 'currentUser'] as const;

export function useCurrentUserQuery() {
  const repository = useAuthRepository();
  return useQuery({
    queryKey: currentUserKey,
    queryFn: () => repository.getCurrentUser(),
    staleTime: Infinity,
  });
}

export function useSignIn() {
  const repository = useAuthRepository();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (credentials: Credentials) => repository.signIn(credentials),
    onSuccess: (user) => queryClient.setQueryData(currentUserKey, user),
  });
}

/** Drops every cached query so nothing from the previous user survives. */
export function useSignOut() {
  const repository = useAuthRepository();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => repository.signOut(),
    onSuccess: () => {
      queryClient.clear();
      queryClient.setQueryData(currentUserKey, null);
    },
  });
}
