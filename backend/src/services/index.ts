// ============================================================
// FILE: backend/src/services/index.ts
// DESCRIPTION: Export all services
// ============================================================

// Default exports
export { default as authService } from './auth.service';
export { default as animalService } from './animal.service';
export { default as districtService } from './district.service';
export { default as requestService } from './request.service';

// Also export individual functions if needed
export * from './auth.service';
export * from './animal.service';
export * from './district.service';
export * from './request.service';