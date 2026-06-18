// backend/src/config/permissions.ts

/**
 * =========================
 * PERMISSIONS SYSTEM
 * =========================
 */
export const PERMISSIONS = {
  // User Management
  USER_READ: 'user:read',
  USER_CREATE: 'user:create',
  USER_UPDATE: 'user:update',
  USER_DELETE: 'user:delete',
  USER_APPROVE: 'user:approve',
  USER_REJECT: 'user:reject',
  USER_SUSPEND: 'user:suspend',
  USER_ACTIVATE: 'user:activate',
  USER_ROLE_UPDATE: 'user:role:update',
  
  // Animal Management
  ANIMAL_READ: 'animal:read',
  ANIMAL_CREATE: 'animal:create',
  ANIMAL_UPDATE: 'animal:update',
  ANIMAL_DELETE: 'animal:delete',
  ANIMAL_HEALTH_UPDATE: 'animal:health:update',
  
  // Veterinary Services
  VET_PROFILE_READ: 'vet:profile:read',
  VET_PROFILE_UPDATE: 'vet:profile:update',
  VET_AVAILABILITY_UPDATE: 'vet:availability:update',
  VET_VERIFY: 'vet:verify',
  
  // Requests
  REQUEST_READ: 'request:read',
  REQUEST_CREATE: 'request:create',
  REQUEST_UPDATE: 'request:update',
  REQUEST_DELETE: 'request:delete',
  REQUEST_ACCEPT: 'request:accept',
  REQUEST_REJECT: 'request:reject',
  REQUEST_COMPLETE: 'request:complete',
  
  // Appointments
  APPOINTMENT_READ: 'appointment:read',
  APPOINTMENT_CREATE: 'appointment:create',
  APPOINTMENT_UPDATE: 'appointment:update',
  APPOINTMENT_DELETE: 'appointment:delete',
  APPOINTMENT_CANCEL: 'appointment:cancel',
  APPOINTMENT_RESCHEDULE: 'appointment:reschedule',
  APPOINTMENT_COMPLETE: 'appointment:complete',
  
  // Messages & Chat
  MESSAGE_READ: 'message:read',
  MESSAGE_SEND: 'message:send',
  MESSAGE_DELETE: 'message:delete',
  
  // Notifications
  NOTIFICATION_READ: 'notification:read',
  NOTIFICATION_CREATE: 'notification:create',
  NOTIFICATION_DELETE: 'notification:delete',
  
  // Dashboard & Stats
  STATS_VIEW: 'stats:view',
  DASHBOARD_VIEW: 'dashboard:view',
  
  // Products & Orders
  PRODUCT_READ: 'product:read',
  PRODUCT_CREATE: 'product:create',
  PRODUCT_UPDATE: 'product:update',
  PRODUCT_DELETE: 'product:delete',
  ORDER_READ: 'order:read',
  ORDER_CREATE: 'order:create',
  ORDER_UPDATE: 'order:update',
  ORDER_DELETE: 'order:delete',
  
  // Reports
  REPORT_VIEW: 'report:view',
  REPORT_GENERATE: 'report:generate',
  REPORT_EXPORT: 'report:export',
  
  // System
  SYSTEM_CONFIG: 'system:config',
  SYSTEM_BACKUP: 'system:backup',
  SYSTEM_RESTORE: 'system:restore',
  
  // Emergency SOS
  SOS_SEND: 'sos:send',
  SOS_RESOLVE: 'sos:resolve',
  SOS_VIEW: 'sos:view',
};

/**
 * =========================
 * ROLE PERMISSIONS MAP
 * =========================
 */
export const ROLE_PERMISSIONS: Record<string, string[]> = {
  // 🟢 Super Admin - Full access to EVERYTHING
  super_admin: Object.values(PERMISSIONS),
  
  // 🟡 District Admin - Can manage users in their district
  district_admin: [
    // ✅ User Management - Full access within district
    PERMISSIONS.USER_READ,
    PERMISSIONS.USER_APPROVE,
    PERMISSIONS.USER_REJECT,
    PERMISSIONS.USER_SUSPEND,
    PERMISSIONS.USER_ACTIVATE,
    PERMISSIONS.USER_ROLE_UPDATE,
    // PERMISSIONS.USER_DELETE is NOT included - only super admin can delete
    // PERMISSIONS.USER_CREATE is NOT included - only super admin can create admins
    
    // ✅ Animal Management
    PERMISSIONS.ANIMAL_READ,
    PERMISSIONS.ANIMAL_CREATE,
    PERMISSIONS.ANIMAL_UPDATE,
    // PERMISSIONS.ANIMAL_DELETE - Only farmer or super admin
    
    // ✅ Veterinary Services
    PERMISSIONS.VET_PROFILE_READ,
    PERMISSIONS.VET_PROFILE_UPDATE,
    PERMISSIONS.VET_AVAILABILITY_UPDATE,
    PERMISSIONS.VET_VERIFY,
    
    // ✅ Requests
    PERMISSIONS.REQUEST_READ,
    PERMISSIONS.REQUEST_ACCEPT,
    PERMISSIONS.REQUEST_REJECT,
    PERMISSIONS.REQUEST_COMPLETE,
    PERMISSIONS.REQUEST_UPDATE,
    
    // ✅ Appointments
    PERMISSIONS.APPOINTMENT_READ,
    PERMISSIONS.APPOINTMENT_CREATE,
    PERMISSIONS.APPOINTMENT_UPDATE,
    PERMISSIONS.APPOINTMENT_CANCEL,
    PERMISSIONS.APPOINTMENT_RESCHEDULE,
    PERMISSIONS.APPOINTMENT_COMPLETE,
    
    // ✅ Messages
    PERMISSIONS.MESSAGE_READ,
    PERMISSIONS.MESSAGE_SEND,
    
    // ✅ Notifications
    PERMISSIONS.NOTIFICATION_READ,
    PERMISSIONS.NOTIFICATION_CREATE,
    
    // ✅ Dashboard & Stats
    PERMISSIONS.STATS_VIEW,
    PERMISSIONS.DASHBOARD_VIEW,
    
    // ✅ Reports
    PERMISSIONS.REPORT_VIEW,
    
    // ✅ Emergency SOS
    PERMISSIONS.SOS_VIEW,
    PERMISSIONS.SOS_RESOLVE,
  ],
  
  // 🟣 Veterinarian
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
  
  // 🟢 Farmer
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
export const hasPermission = (role: string, permission: string): boolean => {
  const permissions = ROLE_PERMISSIONS[role] || [];
  return permissions.includes(permission);
};

export const getRoleName = (role: string): string => {
  const roleNames: Record<string, string> = {
    super_admin: 'Super Admin',
    district_admin: 'District Admin',
    veterinarian: 'Veterinarian',
    farmer: 'Farmer',
  };
  return roleNames[role] || role;
};

export const getAvailableRoles = (): string[] => {
  return Object.keys(ROLE_PERMISSIONS);
};

export const getRoleColor = (role: string): string => {
  const colors: Record<string, string> = {
    super_admin: '#D32F2F',
    district_admin: '#FF9800',
    veterinarian: '#9C27B0',
    farmer: '#2196F3',
  };
  return colors[role] || '#666';
};

export const isSuperAdmin = (role: string): boolean => {
  return role === 'super_admin';
};

export const isDistrictAdmin = (role: string): boolean => {
  return role === 'district_admin';
};

export const isVeterinarian = (role: string): boolean => {
  return role === 'veterinarian';
};

export const isFarmer = (role: string): boolean => {
  return role === 'farmer';
};