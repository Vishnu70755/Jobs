import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { customFetch } from "@workspace/api-client-react";

// Define types for our API responses
export interface ImportStatus {
  isRunning: boolean;
  lastRunAt: string | null;
  nextRunAt: string | null;
  intervalMinutes: number;
  totalImportedJobs: number;
  jobsImportedToday: number;
  activeSources: number;
  logs: Array<{
    id: string;
    timestamp: string;
    message: string;
    level: 'info' | 'success' | 'warning' | 'error';
  }>;
}

export interface ImportStats {
  totalImportedJobs: number;
  jobsImportedToday: number;
  activeSources: number;
}

// Hook to query import status
export const useImportStatusQuery = () => {
  return useQuery({
    queryKey: ['import', 'status'],
    queryFn: async () => {
      const response = await customFetch<{ data: ImportStatus[] }>(
        '/api/admin/import/status',
        { method: 'GET' }
      );
      return response.data;
    },
    refetchInterval: 5000, // Poll every 5 seconds for status updates
  });
};

// Hook to import statistics
export const useImportStatsQuery = () => {
  return useQuery({
    queryKey: ['import', 'stats'],
    queryFn: async () => {
      const response = await customFetch<{ data: ImportStats }>(
        '/api/admin/import/stats',
        { method: 'GET' }
      );
      return response.data;
    },
    refetchInterval: 15000, // Less frequent for stats
  });
};

// Hook to start import
export const useStartImportMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await customFetch<void>('/api/admin/import/start', { method: 'POST' });
    },
    onSuccess: () => {
      // Invalidate and refetch queries
      queryClient.invalidateQueries({ queryKey: ['import', 'status'] });
      queryClient.invalidateQueries({ queryKey: ['import', 'stats'] });
    },
  });
};

// Hook to stop import
export const useStopImportMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await customFetch<void>('/api/admin/import/stop', { method: 'POST' });
    },
    onSuccess: () => {
      // Invalidate and refetch queries
      queryClient.invalidateQueries({ queryKey: ['import', 'status'] });
      queryClient.invalidateQueries({ queryKey: ['import', 'stats'] });
    },
  });
};
