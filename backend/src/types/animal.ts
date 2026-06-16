// backend/src/types/animal.ts

// Animal categories
export type AnimalCategory = 
  | 'cow' 
  | 'goat' 
  | 'sheep' 
  | 'pig' 
  | 'chicken' 
  | 'rabbit'
  | 'horse'
  | 'duck'
  | 'turkey'
  | 'other';

// Health status options
export type HealthStatus = 
  | 'healthy' 
  | 'sick' 
  | 'recovering' 
  | 'under_treatment' 
  | 'critical'
  | 'deceased'
  | 'quarantined';

// Gender options
export type Gender = 'male' | 'female';

// Vaccination status
export type VaccinationStatus = 
  | 'up_to_date' 
  | 'overdue' 
  | 'partial' 
  | 'not_vaccinated';

// Animal interface
export interface Animal {
  id: string | number;
  farmer_id: string;
  name: string;
  category: AnimalCategory;
  breed: string;
  gender: Gender;
  birth_date: string;
  age?: number;
  weight?: number;
  color?: string;
  identification_tag?: string;
  photo?: string;
  notes?: string;
  health_status: HealthStatus;
  last_checkup?: string;
  next_checkup_due?: string;
  veterinary_history?: VeterinaryRecord[];
  vaccination_status?: VaccinationStatus;
  vaccinations?: VaccinationRecord[];
  is_pregnant?: boolean;
  expected_delivery_date?: string;
  last_breeding_date?: string;
  milk_production?: number;
  last_weighed?: number;
  last_weighed_date?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  is_active: boolean;
}

// Veterinary record
export interface VeterinaryRecord {
  id: string;
  animal_id: string;
  veterinarian_name: string;
  visit_date: string;
  diagnosis: string;
  treatment: string;
  prescribed_medication?: string;
  cost?: number;
  notes?: string;
  follow_up_required: boolean;
  follow_up_date?: string;
  created_at: string;
}

// Vaccination record
export interface VaccinationRecord {
  id: string;
  animal_id: string;
  vaccine_name: string;
  administered_date: string;
  next_due_date: string;
  administered_by: string;
  batch_number?: string;
  notes?: string;
  created_at: string;
}

// Animal filter options
export interface AnimalFilter {
  category?: AnimalCategory;
  health_status?: HealthStatus;
  gender?: Gender;
  search?: string;
  page?: number;
  limit?: number;
  sort_by?: 'name' | 'age' | 'created_at' | 'health_status';
  sort_order?: 'asc' | 'desc';
  is_pregnant?: boolean;
  vaccination_status?: VaccinationStatus;
}

// Animal statistics
export interface AnimalStats {
  total: number;
  by_category: Record<AnimalCategory, number>;
  by_health_status: Record<HealthStatus, number>;
  by_gender: Record<Gender, number>;
  pregnant_count: number;
  vaccinated_count: number;
  needs_checkup_count: number;
  average_age: number;
  average_weight?: number;
}

// Create animal payload
export interface CreateAnimalPayload {
  name: string;
  category: AnimalCategory;
  breed: string;
  gender: Gender;
  birth_date?: string;
  weight?: number;
  color?: string;
  identification_tag?: string;
  photo?: string;
  notes?: string;
  is_pregnant?: boolean;
  expected_delivery_date?: string;
}

// Update animal payload
export interface UpdateAnimalPayload extends Partial<CreateAnimalPayload> {
  health_status?: HealthStatus;
  is_active?: boolean;
}

// Health update payload
export interface HealthUpdatePayload {
  health_status: HealthStatus;
  notes?: string;
  last_checkup?: string;
  next_checkup_due?: string;
}

// Helper functions
export const getAnimalIcon = (category: AnimalCategory): string => {
  const icons: Record<AnimalCategory, string> = {
    cow: '🐄',
    goat: '🐐',
    sheep: '🐑',
    pig: '🐷',
    chicken: '🐔',
    rabbit: '🐰',
    horse: '🐴',
    duck: '🦆',
    turkey: '🦃',
    other: '🐾',
  };
  return icons[category] || icons.other;
};

export const getHealthStatusColor = (status: HealthStatus): string => {
  const colors: Record<HealthStatus, string> = {
    healthy: '#4CAF50',
    sick: '#f44336',
    recovering: '#FF9800',
    under_treatment: '#2196F3',
    critical: '#9C27B0',
    deceased: '#666',
    quarantined: '#FF5722',
  };
  return colors[status];
};

export const getHealthStatusText = (status: HealthStatus): string => {
  const texts: Record<HealthStatus, string> = {
    healthy: 'Healthy',
    sick: 'Sick',
    recovering: 'Recovering',
    under_treatment: 'Under Treatment',
    critical: 'Critical',
    deceased: 'Deceased',
    quarantined: 'Quarantined',
  };
  return texts[status];
};

export const getGenderIcon = (gender: Gender): string => {
  return gender === 'male' ? '♂️' : '♀️';
};

export const getVaccinationStatusColor = (status: VaccinationStatus): string => {
  const colors: Record<VaccinationStatus, string> = {
    up_to_date: '#4CAF50',
    overdue: '#f44336',
    partial: '#FF9800',
    not_vaccinated: '#999',
  };
  return colors[status];
};

export const calculateAge = (birthDate: string): number => {
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
};

export const formatAnimalAge = (birthDate: string): string => {
  const age = calculateAge(birthDate);
  if (age < 1) {
    const months = Math.floor((new Date().getTime() - new Date(birthDate).getTime()) / (1000 * 60 * 60 * 24 * 30));
    return `${months} month${months !== 1 ? 's' : ''}`;
  }
  return `${age} year${age !== 1 ? 's' : ''}`;
};

// ✅ FIXED: Remove default export that tries to export types as values
// Instead, just export the helper functions as a group if needed
export const animalHelpers = {
  getAnimalIcon,
  getHealthStatusColor,
  getHealthStatusText,
  getGenderIcon,
  getVaccinationStatusColor,
  calculateAge,
  formatAnimalAge,
};