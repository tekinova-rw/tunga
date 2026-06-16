// src/services/animal-service.ts
import { api } from '../api/axios';

// Types
export type Animal = {
  id: string;
  name: string;
  category: string;
  breed: string;
  age: number;
  weight: number;
  health_status: 'healthy' | 'sick' | 'recovering' | 'under_treatment' | 'pregnant';
  notes: string;
  farmer_id: string;
  farmer_name?: string;
  created_at: string;
  updated_at: string;
};

export type CreateAnimalPayload = {
  name: string;
  category: string;
  breed?: string;
  age?: number;
  weight?: number;
  health_status?: string;
  notes?: string;
};

export type UpdateAnimalPayload = Partial<CreateAnimalPayload>;

export type HealthUpdatePayload = {
  health_status: string;
  notes?: string;
};

export type AnimalFilter = {
  category?: string;
  health_status?: string;
  search?: string;
  page?: number;
  limit?: number;
};

export type AnimalResponse = {
  success: boolean;
  data: Animal | Animal[];
  message?: string;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  };
};

// Farmer endpoints
export const getAnimals = async (filter?: AnimalFilter): Promise<Animal[]> => {
  try {
    const params = new URLSearchParams();
    if (filter?.category) params.append('category', filter.category);
    if (filter?.health_status) params.append('health_status', filter.health_status);
    if (filter?.search) params.append('search', filter.search);
    if (filter?.page) params.append('page', filter.page.toString());
    if (filter?.limit) params.append('limit', filter.limit.toString());

    const url = `/farmer/animals${params.toString() ? `?${params.toString()}` : ''}`;
    const response = await api.get(url);
    
    return response.data.data || response.data;
  } catch (error: any) {
    console.error('Get animals error:', error?.response?.data);
    throw error;
  }
};

export const getAnimalById = async (id: string): Promise<Animal> => {
  try {
    const response = await api.get(`/farmer/animals/${id}`);
    return response.data.data || response.data;
  } catch (error: any) {
    console.error('Get animal by id error:', error?.response?.data);
    throw error;
  }
};

export const createAnimal = async (payload: CreateAnimalPayload): Promise<Animal> => {
  try {
    const response = await api.post('/farmer/animals', payload);
    return response.data.data || response.data;
  } catch (error: any) {
    console.error('Create animal error:', error?.response?.data);
    throw error;
  }
};

export const updateAnimal = async (id: string, payload: UpdateAnimalPayload): Promise<Animal> => {
  try {
    const response = await api.put(`/farmer/animals/${id}`, payload);
    return response.data.data || response.data;
  } catch (error: any) {
    console.error('Update animal error:', error?.response?.data);
    throw error;
  }
};

export const updateAnimalHealth = async (id: string, payload: HealthUpdatePayload): Promise<Animal> => {
  try {
    const response = await api.patch(`/farmer/animals/${id}/health`, payload);
    return response.data.data || response.data;
  } catch (error: any) {
    console.error('Update animal health error:', error?.response?.data);
    throw error;
  }
};

export const deleteAnimal = async (id: string): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await api.delete(`/farmer/animals/${id}`);
    return response.data;
  } catch (error: any) {
    console.error('Delete animal error:', error?.response?.data);
    throw error;
  }
};

// Vet endpoints
export const getVetAnimals = async (filter?: AnimalFilter): Promise<Animal[]> => {
  try {
    const params = new URLSearchParams();
    if (filter?.category) params.append('category', filter.category);
    if (filter?.health_status) params.append('health_status', filter.health_status);
    if (filter?.search) params.append('search', filter.search);
    if (filter?.page) params.append('page', filter.page.toString());
    if (filter?.limit) params.append('limit', filter.limit.toString());

    const url = `/vet/animals${params.toString() ? `?${params.toString()}` : ''}`;
    const response = await api.get(url);
    
    return response.data.data || response.data;
  } catch (error: any) {
    console.error('Get vet animals error:', error?.response?.data);
    throw error;
  }
};

export const getAnimalByVet = async (id: string): Promise<Animal> => {
  try {
    const response = await api.get(`/vet/animals/${id}`);
    return response.data.data || response.data;
  } catch (error: any) {
    console.error('Get animal by vet error:', error?.response?.data);
    throw error;
  }
};

// Statistics endpoints
export const getAnimalStats = async (): Promise<{
  total_animals: number;
  by_category: Record<string, number>;
  by_health_status: Record<string, number>;
}> => {
  try {
    const response = await api.get('/farmer/animals/stats');
    return response.data.data || response.data;
  } catch (error: any) {
    console.error('Get animal stats error:', error?.response?.data);
    throw error;
  }
};

// Helper functions
export const getHealthStatusColor = (status: string): string => {
  switch (status?.toLowerCase()) {
    case 'healthy': return '#4CAF50';
    case 'sick': return '#f44336';
    case 'recovering': return '#FF9800';
    case 'under_treatment': return '#2196F3';
    case 'pregnant': return '#9C27B0';
    default: return '#999';
  }
};

export const getHealthStatusIcon = (status: string): string => {
  switch (status?.toLowerCase()) {
    case 'healthy': return 'checkmark-circle-outline';
    case 'sick': return 'warning-outline';
    case 'recovering': return 'fitness-outline';
    case 'under_treatment': return 'medkit-outline';
    case 'pregnant': return 'paw-outline';
    default: return 'help-outline';
  }
};

export const getCategoryIcon = (category: string): string => {
  switch (category?.toLowerCase()) {
    case 'cow': return '🐄';
    case 'goat': return '🐐';
    case 'sheep': return '🐑';
    case 'pig': return '🐷';
    case 'chicken': return '🐔';
    case 'rabbit': return '🐰';
    default: return '🐾';
  }
};

export const validateAnimal = (data: Partial<CreateAnimalPayload>): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!data.name || data.name.trim().length < 2) {
    errors.push('Animal name must be at least 2 characters');
  }
  
  if (!data.category) {
    errors.push('Category is required');
  }
  
  if (data.age !== undefined && (isNaN(data.age) || data.age < 0)) {
    errors.push('Age must be a positive number');
  }
  
  if (data.weight !== undefined && (isNaN(data.weight) || data.weight < 0)) {
    errors.push('Weight must be a positive number');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
};

// Batch operations
export const bulkDeleteAnimals = async (ids: string[]): Promise<{ success: boolean; deleted_count: number }> => {
  try {
    const response = await api.post('/farmer/animals/bulk-delete', { ids });
    return response.data;
  } catch (error: any) {
    console.error('Bulk delete error:', error?.response?.data);
    throw error;
  }
};

export const bulkUpdateHealth = async (updates: { id: string; health_status: string }[]): Promise<{ success: boolean; updated_count: number }> => {
  try {
    const response = await api.post('/farmer/animals/bulk-update-health', { updates });
    return response.data;
  } catch (error: any) {
    console.error('Bulk update health error:', error?.response?.data);
    throw error;
  }
};

// Export all functions as a service object
const animalService = {
  // Farmer endpoints
  getAnimals,
  getAnimalById,
  createAnimal,
  updateAnimal,
  updateAnimalHealth,
  deleteAnimal,
  getAnimalStats,
  
  // Vet endpoints
  getVetAnimals,
  getAnimalByVet,
  
  // Utilities
  getHealthStatusColor,
  getHealthStatusIcon,
  getCategoryIcon,
  validateAnimal,
  
  // Batch operations
  bulkDeleteAnimals,
  bulkUpdateHealth,
};

export default animalService;