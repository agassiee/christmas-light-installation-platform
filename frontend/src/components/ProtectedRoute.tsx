import { Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import React from 'react';

export const ProtectedRoute = ({ children, requiredRole }: { children: React.ReactNode, requiredRole?: string }) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      const res = await apiClient.get('/auth/me');
      return res.data;
    },
    retry: false,
  });

  if (isLoading) return <div>Loading...</div>;

  if (error || !data?.success) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && data.data.role !== requiredRole) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};
