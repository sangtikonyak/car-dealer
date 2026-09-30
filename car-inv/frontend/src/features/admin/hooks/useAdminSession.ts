import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchAdminSession, loginAdmin, logoutAdmin } from '../api';

export const adminSessionKey = ['admin-session'];

export const useAdminSession = () =>
  useQuery({
    queryKey: adminSessionKey,
    queryFn: fetchAdminSession,
    staleTime: 60_000,
    retry: false,
  });

export const useAdminLogin = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      loginAdmin(email, password),
    onSuccess: (user) => queryClient.setQueryData(adminSessionKey, user),
  });
};

export const useAdminLogout = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: logoutAdmin,
    onSuccess: () => queryClient.setQueryData(adminSessionKey, null),
  });
};
