import { api } from './client';
import type {
  AuthResponse,
  AuthUser,
  Medicine,
  MedicineCategory,
  MedicineImport,
  Paginated,
  Permission,
  Role,
  Supplier,
  User,
} from '../types';

// ----- Auth -----
export const authApi = {
  login: (email: string, password: string) =>
    api.post<AuthResponse>('/auth/login', { email, password }, { skipAuth: true }),
  register: (data: {
    email: string;
    username: string;
    password: string;
    fullName: string;
  }) => api.post<AuthResponse>('/auth/register', data, { skipAuth: true }),
  me: () => api.get<AuthUser>('/auth/me'),
};

// ----- Users -----
export const usersApi = {
  list: (params: { page?: number; limit?: number; search?: string } = {}) =>
    api.get<Paginated<User>>('/users', params),
  get: (id: string) => api.get<User>(`/users/${id}`),
  create: (data: {
    email: string;
    username: string;
    password: string;
    fullName: string;
    isActive?: boolean;
    roleIds?: string[];
  }) => api.post<User>('/users', data),
  update: (
    id: string,
    data: Partial<{
      email: string;
      username: string;
      fullName: string;
      isActive: boolean;
      password: string;
    }>,
  ) => api.patch<User>(`/users/${id}`, data),
  remove: (id: string) => api.delete<void>(`/users/${id}`),
  assignRoles: (id: string, roleIds: string[]) =>
    api.post<User>(`/users/${id}/roles`, { roleIds }),
  grantPermissions: (
    id: string,
    grants: Array<{ permissionId: string; effect: 'allow' | 'deny' }>,
  ) => api.post<User>(`/users/${id}/permissions`, { grants }),
};

// ----- Roles -----
export const rolesApi = {
  list: () => api.get<Role[]>('/roles'),
  get: (id: string) => api.get<Role>(`/roles/${id}`),
  create: (data: { name: string; description?: string; permissionIds?: string[] }) =>
    api.post<Role>('/roles', data),
  update: (
    id: string,
    data: { name?: string; description?: string; permissionIds?: string[] },
  ) => api.patch<Role>(`/roles/${id}`, data),
  remove: (id: string) => api.delete<void>(`/roles/${id}`),
};

// ----- Permissions -----
export const permissionsApi = {
  list: () => api.get<Permission[]>('/permissions'),
  grouped: () => api.get<Record<string, Permission[]>>('/permissions/grouped'),
};

// ----- Medicines -----
export const medicinesApi = {
  list: (
    params: {
      page?: number;
      limit?: number;
      search?: string;
      categoryId?: string;
      isActive?: boolean;
    } = {},
  ) => api.get<Paginated<Medicine>>('/medicines', params),
  get: (id: string) => api.get<Medicine>(`/medicines/${id}`),
  create: (data: Partial<Medicine> & { code: string; name: string }) =>
    api.post<Medicine>('/medicines', data),
  update: (id: string, data: Partial<Medicine>) =>
    api.patch<Medicine>(`/medicines/${id}`, data),
  remove: (id: string) => api.delete<void>(`/medicines/${id}`),

  listCategories: () => api.get<MedicineCategory[]>('/medicines/categories'),
  createCategory: (data: { name: string; description?: string }) =>
    api.post<MedicineCategory>('/medicines/categories', data),
  updateCategory: (id: string, data: { name?: string; description?: string }) =>
    api.patch<MedicineCategory>(`/medicines/categories/${id}`, data),
  removeCategory: (id: string) =>
    api.delete<void>(`/medicines/categories/${id}`),
};

// ----- Suppliers -----
export const suppliersApi = {
  list: (params: { page?: number; limit?: number; search?: string } = {}) =>
    api.get<Paginated<Supplier>>('/suppliers', params),
  listAll: () => api.get<Supplier[]>('/suppliers/all'),
  get: (id: string) => api.get<Supplier>(`/suppliers/${id}`),
  create: (data: Partial<Supplier> & { name: string }) =>
    api.post<Supplier>('/suppliers', data),
  update: (id: string, data: Partial<Supplier>) =>
    api.patch<Supplier>(`/suppliers/${id}`, data),
  remove: (id: string) => api.delete<void>(`/suppliers/${id}`),
};

// ----- Medicine Imports -----
export const medicineImportsApi = {
  list: (params: { page?: number; limit?: number; search?: string } = {}) =>
    api.get<Paginated<MedicineImport>>('/medicine-imports', params),
  get: (id: string) => api.get<MedicineImport>(`/medicine-imports/${id}`),
  create: (data: {
    supplierId: string;
    importDate: string;
    notes?: string;
    items: Array<{
      medicineId: string;
      batchNumber: string;
      expiryDate: string;
      quantity: number;
      unitPrice: number;
    }>;
  }) => api.post<MedicineImport>('/medicine-imports', data),
  update: (id: string, data: any) =>
    api.patch<MedicineImport>(`/medicine-imports/${id}`, data),
  complete: (id: string) =>
    api.post<MedicineImport>(`/medicine-imports/${id}/complete`),
  cancel: (id: string) =>
    api.post<MedicineImport>(`/medicine-imports/${id}/cancel`),
  remove: (id: string) => api.delete<void>(`/medicine-imports/${id}`),
};
