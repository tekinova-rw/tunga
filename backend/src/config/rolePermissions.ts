// backend/src/config/rolePermissions.ts

import { PERMISSIONS } from './permissions';

export const ROLE_PERMISSIONS: Record<string, string[]> = {
  super_admin: [
    PERMISSIONS.USER_READ,
    PERMISSIONS.USER_APPROVE,
    PERMISSIONS.USER_REJECT,
    PERMISSIONS.USER_DELETE,
    PERMISSIONS.STATS_VIEW,
  ],

  district_admin: [
    PERMISSIONS.USER_READ,
    PERMISSIONS.USER_APPROVE,
    PERMISSIONS.USER_REJECT,
    PERMISSIONS.STATS_VIEW,
  ],

  user: [],
};