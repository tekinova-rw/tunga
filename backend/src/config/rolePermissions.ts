// backend/src/config/rolePermissions.ts
import { PERMISSIONS } from './permissions';

/**
 * =========================
 * ROLE PERMISSIONS MAP
 * =========================
 * Defines which permissions each role has
 */
export const ROLE_PERMISSIONS: Record<string, string[]> = {
  // Super Admin - Full access to everything
  super_admin: Object.values(PERMISSIONS),
  
  // District Admin - Manage users and requests in their district
  district_admin: [
    PERMISSIONS.USER_READ,
    PERMISSIONS.USER_APPROVE,
    PERMISSIONS.USER_REJECT,
    PERMISSIONS.USER_SUSPEND,
    PERMISSIONS.USER_ACTIVATE,
    PERMISSIONS.ANIMAL_READ,
    PERMISSIONS.REQUEST_READ,
    PERMISSIONS.REQUEST_ACCEPT,
    PERMISSIONS.REQUEST_REJECT,
    PERMISSIONS.REQUEST_COMPLETE,
    PERMISSIONS.APPOINTMENT_READ,
    PERMISSIONS.APPOINTMENT_CREATE,
    PERMISSIONS.APPOINTMENT_UPDATE,
    PERMISSIONS.APPOINTMENT_CANCEL,
    PERMISSIONS.APPOINTMENT_RESCHEDULE,
    PERMISSIONS.MESSAGE_READ,
    PERMISSIONS.MESSAGE_SEND,
    PERMISSIONS.NOTIFICATION_READ,
    PERMISSIONS.NOTIFICATION_CREATE,
    PERMISSIONS.STATS_VIEW,
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.VET_VERIFY,
    PERMISSIONS.REPORT_VIEW,
    PERMISSIONS.SOS_VIEW,
    PERMISSIONS.SOS_RESOLVE,
  ],
  
  // Veterinarian - Manage appointments, requests, and animal health
  veterinarian: [
    PERMISSIONS.USER_READ,
    PERMISSIONS.ANIMAL_READ,
    PERMISSIONS.ANIMAL_UPDATE,
    PERMISSIONS.ANIMAL_HEALTH_UPDATE,
    PERMISSIONS.VET_PROFILE_READ,
    PERMISSIONS.VET_PROFILE_UPDATE,
    PERMISSIONS.VET_AVAILABILITY_UPDATE,
    PERMISSIONS.REQUEST_READ,
    PERMISSIONS.REQUEST_ACCEPT,
    PERMISSIONS.REQUEST_UPDATE,
    PERMISSIONS.REQUEST_COMPLETE,
    PERMISSIONS.APPOINTMENT_READ,
    PERMISSIONS.APPOINTMENT_CREATE,
    PERMISSIONS.APPOINTMENT_UPDATE,
    PERMISSIONS.APPOINTMENT_COMPLETE,
    PERMISSIONS.APPOINTMENT_CANCEL,
    PERMISSIONS.APPOINTMENT_RESCHEDULE,
    PERMISSIONS.MESSAGE_READ,
    PERMISSIONS.MESSAGE_SEND,
    PERMISSIONS.NOTIFICATION_READ,
    PERMISSIONS.NOTIFICATION_CREATE,
    PERMISSIONS.SOS_VIEW,
    PERMISSIONS.SOS_SEND,
  ],
  
  // Farmer - Manage own animals and requests
  farmer: [
    PERMISSIONS.USER_READ,
    PERMISSIONS.ANIMAL_READ,
    PERMISSIONS.ANIMAL_CREATE,
    PERMISSIONS.ANIMAL_UPDATE,
    PERMISSIONS.ANIMAL_DELETE,
    PERMISSIONS.REQUEST_READ,
    PERMISSIONS.REQUEST_CREATE,
    PERMISSIONS.REQUEST_UPDATE,
    PERMISSIONS.REQUEST_DELETE,
    PERMISSIONS.APPOINTMENT_READ,
    PERMISSIONS.APPOINTMENT_CREATE,
    PERMISSIONS.APPOINTMENT_UPDATE,
    PERMISSIONS.APPOINTMENT_CANCEL,
    PERMISSIONS.APPOINTMENT_RESCHEDULE,
    PERMISSIONS.MESSAGE_READ,
    PERMISSIONS.MESSAGE_SEND,
    PERMISSIONS.NOTIFICATION_READ,
    PERMISSIONS.SOS_SEND,
  ],
};

/**
 * =========================
 * HELPER FUNCTIONS
 * =========================
 */

/**
 * Check if a role has a specific permission
 */
export const hasPermission = (role: string, permission: string): boolean => {
  const permissions = ROLE_PERMISSIONS[role] || [];
  return permissions.includes(permission);
};

/**
 * Get the role name in a human-readable format
 */
export const getRoleName = (role: string): string => {
  const roleNames: Record<string, string> = {
    super_admin: 'Super Admin',
    district_admin: 'District Admin',
    veterinarian: 'Veterinarian',
    farmer: 'Farmer',
  };
  return roleNames[role] || role;
};

/**
 * Get all available roles
 */
export const getAvailableRoles = (): string[] => {
  return Object.keys(ROLE_PERMISSIONS);
};

/**
 * Get role color for UI
 */
export const getRoleColor = (role: string): string => {
  const colors: Record<string, string> = {
    super_admin: '#D32F2F',
    district_admin: '#FF9800',
    veterinarian: '#9C27B0',
    farmer: '#2196F3',
  };
  return colors[role] || '#666';
};