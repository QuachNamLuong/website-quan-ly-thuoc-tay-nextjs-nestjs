// ----- Permission constants (mirror backend) -----

export const PERMISSIONS = {
  USER_CREATE: 'user:create',
  USER_READ: 'user:read',
  USER_UPDATE: 'user:update',
  USER_DELETE: 'user:delete',
  USER_ASSIGN_ROLE: 'user:assign_role',
  USER_GRANT_PERMISSION: 'user:grant_permission',

  ROLE_CREATE: 'role:create',
  ROLE_READ: 'role:read',
  ROLE_UPDATE: 'role:update',
  ROLE_DELETE: 'role:delete',

  PERMISSION_READ: 'permission:read',

  MEDICINE_CREATE: 'medicine:create',
  MEDICINE_READ: 'medicine:read',
  MEDICINE_UPDATE: 'medicine:update',
  MEDICINE_DELETE: 'medicine:delete',

  MEDICINE_CATEGORY_CREATE: 'medicine_category:create',
  MEDICINE_CATEGORY_READ: 'medicine_category:read',
  MEDICINE_CATEGORY_UPDATE: 'medicine_category:update',
  MEDICINE_CATEGORY_DELETE: 'medicine_category:delete',

  MEDICINE_IMPORT_CREATE: 'medicine_import:create',
  MEDICINE_IMPORT_READ: 'medicine_import:read',
  MEDICINE_IMPORT_UPDATE: 'medicine_import:update',
  MEDICINE_IMPORT_DELETE: 'medicine_import:delete',
  MEDICINE_IMPORT_COMPLETE: 'medicine_import:complete',

  SUPPLIER_CREATE: 'supplier:create',
  SUPPLIER_READ: 'supplier:read',
  SUPPLIER_UPDATE: 'supplier:update',
  SUPPLIER_DELETE: 'supplier:delete',
} as const;

export type PermissionKey = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

// ----- Domain models -----

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  fullName: string;
  roles: string[];
  permissions: string[];
}

export interface AuthResponse {
  accessToken: string;
  user: AuthUser;
}

export interface Paginated<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface MedicineCategory {
  id: string;
  name: string;
  description?: string | null;
}

export type MedicineUnit =
  | 'tablet'
  | 'bottle'
  | 'box'
  | 'tube'
  | 'ampoule'
  | 'vial'
  | 'pack';

export interface Medicine {
  id: string;
  code: string;
  name: string;
  genericName?: string | null;
  manufacturer?: string | null;
  unit: MedicineUnit;
  price: number;
  stockQuantity: number;
  description?: string | null;
  isActive: boolean;
  categoryId?: string | null;
  category?: MedicineCategory | null;
  createdAt: string;
  updatedAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  taxCode?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Permission {
  id: string;
  name: string;
  resource: string;
  action: string;
  description?: string | null;
}

export interface Role {
  id: string;
  name: string;
  description?: string | null;
  isSystem: boolean;
  rolePermissions?: Array<{ permission: Permission }>;
}

export interface User {
  id: string;
  email: string;
  username: string;
  fullName: string;
  isActive: boolean;
  lastLoginAt?: string | null;
  createdAt: string;
  userRoles?: Array<{ role: Role }>;
  userPermissions?: Array<{
    permission: Permission;
    effect: 'allow' | 'deny';
  }>;
}

export type ImportStatus = 'pending' | 'completed' | 'cancelled';

export interface MedicineImportItem {
  id: string;
  medicineId: string;
  medicine?: Medicine;
  batchNumber: string;
  expiryDate: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface MedicineImport {
  id: string;
  importCode: string;
  supplierId: string;
  supplier?: Supplier;
  importedBy: string;
  importer?: { id: string; fullName: string };
  importDate: string;
  status: ImportStatus;
  totalAmount: number;
  notes?: string | null;
  items?: MedicineImportItem[];
  createdAt: string;
}
