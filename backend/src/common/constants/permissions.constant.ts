/**
 * Centralized permission definitions.
 * Format: <RESOURCE>.<ACTION>
 * Keep this in sync with the database seed.
 */
export const PERMISSIONS = {
  // User management
  USER_CREATE: 'user:create',
  USER_READ: 'user:read',
  USER_UPDATE: 'user:update',
  USER_DELETE: 'user:delete',
  USER_ASSIGN_ROLE: 'user:assign_role',
  USER_GRANT_PERMISSION: 'user:grant_permission',

  // Role management
  ROLE_CREATE: 'role:create',
  ROLE_READ: 'role:read',
  ROLE_UPDATE: 'role:update',
  ROLE_DELETE: 'role:delete',

  // Permission management
  PERMISSION_READ: 'permission:read',

  // Medicine management
  MEDICINE_CREATE: 'medicine:create',
  MEDICINE_READ: 'medicine:read',
  MEDICINE_UPDATE: 'medicine:update',
  MEDICINE_DELETE: 'medicine:delete',

  // Medicine category management
  MEDICINE_CATEGORY_CREATE: 'medicine_category:create',
  MEDICINE_CATEGORY_READ: 'medicine_category:read',
  MEDICINE_CATEGORY_UPDATE: 'medicine_category:update',
  MEDICINE_CATEGORY_DELETE: 'medicine_category:delete',

  // Medicine import management
  MEDICINE_IMPORT_CREATE: 'medicine_import:create',
  MEDICINE_IMPORT_READ: 'medicine_import:read',
  MEDICINE_IMPORT_UPDATE: 'medicine_import:update',
  MEDICINE_IMPORT_DELETE: 'medicine_import:delete',
  MEDICINE_IMPORT_COMPLETE: 'medicine_import:complete',

  // Supplier management
  SUPPLIER_CREATE: 'supplier:create',
  SUPPLIER_READ: 'supplier:read',
  SUPPLIER_UPDATE: 'supplier:update',
  SUPPLIER_DELETE: 'supplier:delete',
} as const;

export type PermissionKey = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const ALL_PERMISSIONS: PermissionKey[] = Object.values(PERMISSIONS);

export const SYSTEM_ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  PHARMACIST: 'pharmacist',
  STAFF: 'staff',
} as const;

export type SystemRole = (typeof SYSTEM_ROLES)[keyof typeof SYSTEM_ROLES];
