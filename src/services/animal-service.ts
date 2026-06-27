// ============================================================
// FILE: src/services/animal-service.ts
// DESCRIPTION: Animal service for frontend - calls backend API
// ============================================================

import { api } from './api';

// Types
export type Animal = {
  id: string;
  name: string;
  category: string;
  breed: string;
  age: number;
  weight: number;
  health_status: 'healthy' | 'sick' | 'recovering' | 'under_treatment' | 'critical' | 'deceased' | 'quarantined';
  notes: string;
  farmer_id: string;
  farmer_name?: string;
  created_at: string;
  updated_at: string;
};

export type AnimalFilter = {
  category?: string;
  health_status?: string;
  search?: string;
  page?: number;
  limit?: number;
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

// API Functions
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

// Export all functions as a service object
const animalService = {
  getAnimals,
  getAnimalById,
  createAnimal,
  updateAnimal,
  updateAnimalHealth,
  deleteAnimal,
  getAnimalStats,
};

export default animalService;