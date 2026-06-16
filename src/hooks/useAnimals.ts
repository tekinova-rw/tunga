// src/hooks/useAnimals.ts
import { useQuery } from '@tanstack/react-query';
import { getAnimals } from '@/services/animal-service';
import type { Animal, AnimalFilter } from '@/services/animal-service';

interface UseAnimalsOptions {
  filter?: AnimalFilter;
  enabled?: boolean;
  staleTime?: number;
}

export function useAnimals(options?: UseAnimalsOptions) {
  const { filter, enabled = true, staleTime = 5 * 60 * 1000 } = options || {};

  return useQuery<Animal[], Error>({
    queryKey: ['animals', filter],
    // Create a queryFn that captures the filter
    queryFn: () => getAnimals(filter),
    staleTime,
    gcTime: 10 * 60 * 1000, // 10 minutes
    enabled, // Disable query if needed
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    // Optional: Add select function to transform data
    select: (data) => data,
  });
}

// Hook for getting a single animal by ID
export function useAnimal(id: string | undefined) {
  const { data: animals, ...rest } = useAnimals();
  
  const animal = animals?.find(a => a.id === id);
  
  return {
    animal,
    isLoading: rest.isLoading,
    error: rest.error,
    refetch: rest.refetch,
  };
}

// Hook for animal statistics
export function useAnimalStats() {
  const { data: animals, ...rest } = useAnimals();
  
  const stats = {
    total: animals?.length || 0,
    byCategory: animals?.reduce((acc, animal) => {
      acc[animal.category] = (acc[animal.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    byHealthStatus: animals?.reduce((acc, animal) => {
      const status = animal.health_status || 'unknown';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
  };
  
  return {
    stats,
    isLoading: rest.isLoading,
    error: rest.error,
  };
}

// Hook for paginated animals
export function usePaginatedAnimals(page: number, limit: number = 10) {
  return useQuery<{ data: Animal[]; total: number }, Error>({
    queryKey: ['animals', 'paginated', page, limit],
    queryFn: async () => {
      const animals = await getAnimals();
      const start = (page - 1) * limit;
      const end = start + limit;
      return {
        data: animals.slice(start, end),
        total: animals.length,
      };
    },
    staleTime: 5 * 60 * 1000,
  });
}