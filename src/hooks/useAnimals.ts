// ============================================================
// FILE: src/hooks/useAnimals.ts
// DESCRIPTION: React Query hooks for animal data management
// ============================================================

import { useQuery } from '@tanstack/react-query';
import { getAnimals, getAnimalById, getAnimalStats } from '@/services/animal-service';
import type { Animal, AnimalFilter } from '@/services/animal-service';

interface UseAnimalsOptions {
  filter?: AnimalFilter;
  enabled?: boolean;
  staleTime?: number;
}

/**
 * Hook for fetching animals with filters
 */
export function useAnimals(options?: UseAnimalsOptions) {
  const { filter, enabled = true, staleTime = 5 * 60 * 1000 } = options || {};

  return useQuery<Animal[], Error>({
    queryKey: ['animals', filter],
    queryFn: () => getAnimals(filter),
    staleTime,
    gcTime: 10 * 60 * 1000, // 10 minutes
    enabled,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    select: (data) => data,
  });
}

/**
 * Hook for getting a single animal by ID
 */
export function useAnimal(id: string | undefined) {
  return useQuery<Animal | null, Error>({
    queryKey: ['animal', id],
    queryFn: async () => {
      if (!id) return null;
      return await getAnimalById(id);
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

/**
 * Hook for animal statistics
 * Uses the API endpoint for stats instead of calculating from cached data
 */
export function useAnimalStats() {
  return useQuery({
    queryKey: ['animals', 'stats'],
    queryFn: getAnimalStats,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

/**
 * Hook for paginated animals
 */
export function usePaginatedAnimals(page: number, limit: number = 10, filter?: AnimalFilter) {
  return useQuery<{ data: Animal[]; total: number }, Error>({
    queryKey: ['animals', 'paginated', page, limit, filter],
    queryFn: async () => {
      const animals = await getAnimals(filter);
      const start = (page - 1) * limit;
      const end = start + limit;
      return {
        data: animals.slice(start, end),
        total: animals.length,
      };
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

/**
 * Hook for animals by category
 */
export function useAnimalsByCategory(category: string) {
  return useAnimals({
    filter: { category },
  });
}

/**
 * Hook for animals by health status
 */
export function useAnimalsByHealthStatus(health_status: string) {
  return useAnimals({
    filter: { health_status },
  });
}

/**
 * Hook for searching animals
 */
export function useSearchAnimals(search: string) {
  return useAnimals({
    filter: { search },
  });
}

/**
 * Combined hook for animals with all filters
 */
export function useFilteredAnimals(filters: AnimalFilter) {
  return useAnimals({
    filter: filters,
  });
}

// Export default with all hooks
const useAnimalsDefault = {
  useAnimals,
  useAnimal,
  useAnimalStats,
  usePaginatedAnimals,
  useAnimalsByCategory,
  useAnimalsByHealthStatus,
  useSearchAnimals,
  useFilteredAnimals,
};

export default useAnimalsDefault;