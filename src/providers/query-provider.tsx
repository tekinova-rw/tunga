// src/providers/query-provider.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Platform } from 'react-native';

// Conditionally import devtools only in development
let ReactQueryDevtools: any = null;
if (__DEV__) {
  try {
    // Dynamic import for devtools to avoid production issues
    const devtools = require('@tanstack/react-query-devtools');
    ReactQueryDevtools = devtools.ReactQueryDevtools;
  } catch (error) {
    console.log('React Query Devtools not available');
  }
}

// Configure query client with optimal settings
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache & Stale Time
      staleTime: 5 * 60 * 1000, // 5 minutes - data is considered fresh
      gcTime: 10 * 60 * 1000, // 10 minutes - garbage collection time
      
      // Retry Configuration
      retry: 2, // Retry failed queries twice
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
      
      // Refetching Behavior
      refetchOnWindowFocus: Platform.OS !== 'web', // Disable on web, enable on mobile
      refetchOnMount: true,
      refetchOnReconnect: true,
      
      // Network Mode
      networkMode: 'online', // Only fetch when online
      
      // Error Handling
      throwOnError: false, // Don't throw errors, handle them in components
      
      // Pagination
      placeholderData: (previousData: any) => previousData, // Keep previous data while fetching
    },
    mutations: {
      // Mutation retry
      retry: 1,
      retryDelay: 1000,
      networkMode: 'online',
    },
  },
});

// Optional: Add query client event listeners for debugging
if (__DEV__) {
  queryClient.getQueryCache().subscribe((event) => {
    if (event.type === 'updated' && event.action.type === 'success') {
      console.log(`✅ Query updated: ${event.query.queryKey}`);
    }
    if (event.type === 'removed') {
      console.log(`🗑️ Query removed: ${event.query.queryKey}`);
    }
  });

  // Fixed: Mutation cache event handling
  queryClient.getMutationCache().subscribe((event) => {
    if (event.type === 'updated') {
      console.log(`✅ Mutation updated`);
    }
  });
}

// Helper function to invalidate queries by prefix
export const invalidateQueriesByPrefix = (prefix: string) => {
  const queries = queryClient.getQueryCache().getAll();
  queries.forEach((query) => {
    const queryKey = query.queryKey[0];
    if (typeof queryKey === 'string' && queryKey.startsWith(prefix)) {
      queryClient.invalidateQueries({ queryKey: query.queryKey });
    }
  });
};

// Helper function to clear all queries
export const clearAllQueries = async () => {
  await queryClient.clear();
  console.log('🧹 All queries cleared');
};

// Helper function to reset query client (useful for logout)
export const resetQueryClient = async () => {
  await queryClient.resetQueries();
  await queryClient.removeQueries();
  console.log('🔄 Query client reset');
};

interface QueryProviderProps {
  children: React.ReactNode;
  enableDevtools?: boolean;
}

export function QueryProvider({ 
  children, 
  enableDevtools = false // Disable devtools by default to avoid errors
}: QueryProviderProps) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {enableDevtools && ReactQueryDevtools && (
        <ReactQueryDevtools 
          initialIsOpen={false}
          buttonPosition="bottom-right"
          position="bottom"
        />
      )}
    </QueryClientProvider>
  );
}

// Export query client for direct access (use with caution)
export { queryClient };