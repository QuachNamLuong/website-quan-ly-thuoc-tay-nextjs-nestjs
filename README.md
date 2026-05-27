# Pharmacy Management System

Hệ thống quản lý nhà thuốc với phân quyền role-permission + user-permission, quản lý thuốc, nhập thuốc, nhà cung cấp.

## Kiến trúc

- **Backend**: NestJS 11 + TypeORM + PostgreSQL + Passport.js (Local + JWT)
- **Frontend**: Next.js 15 App Router + React 19 + Tailwind v4
- **Auth**: JWT bearer tokens, hash password bằng bcrypt
- **Phân quyền**: RBAC (Role → Permissions) + direct User-Permission (allow/deny override)
- **Database**: 4NF compliant - tách bảng nối, không có multi-valued attributes, không có transitive dependencies

## Cấu trúc thư mục

```
project/
├── backend/                            # NestJS API
│   ├── src/
│   │   ├── common/                     # Decorators, guards, filters, interceptors, constants, DTOs dùng chung
│   │   ├── config/                     # database, jwt config
│   │   ├── database/                   # Seeder (super admin + system roles + permissions)
│   │   └── modules/
│   │       ├── auth/                   # Login, register, JWT strategy, guards
│   │       ├── users/                  # User CRUD + role assignment + permission grants
│   │       ├── roles/                  # Role CRUD with permissions
│   │       ├── permissions/            # Permissions (read-only, system-defined)
│   │       ├── medicines/              # Medicine + category CRUD
│   │       ├── medicine-imports/       # Import bills with transactional stock update
│   │       └── suppliers/              # Supplier CRUD
│   └── ...
└── frontend/                           # Next.js dashboard
    ├── app/
    │   ├── auth/{login,register}/      # Auth pages
    │   └── dashboard/                  # Protected pages: medicines, imports, suppliers, users, roles, permissions
    ├── components/
    │   ├── ui/                         # Button, Input, Card, Dialog, ...
    │   ├── common/                     # PermissionGate, DataTable, ConfirmDialog, Toast, Spinner
    │   ├── layout/                     # Sidebar, Header, ProtectedRoute
    │   ├── medicines/, users/, roles/  # Feature-specific form dialogs
    └── lib/
        ├── api/                        # API client + resource modules
        ├── hooks/                      # useAuth context
        ├── types/                      # Shared TypeScript types
        └── utils/                      # cn, format helpers
```

## Database schema (4NF)

```
permissions (id, name, resource, action, description, ...)
roles (id, name, description, is_system, ...)
role_permissions (id, role_id, permission_id, granted_at)          ← junction with own identity
users (id, email, username, password_hash, full_name, is_active, last_login_at, ...)
user_roles (id, user_id, role_id, assigned_by, assigned_at)        ← junction
user_permissions (id, user_id, permission_id, effect, granted_by)  ← effect = allow | deny
medicine_categories (id, name, description, ...)
medicines (id, code, name, generic_name, manufacturer, unit, price, stock_quantity, category_id, ...)
suppliers (id, name, email, phone, address, tax_code, is_active, ...)
medicine_imports (id, import_code, supplier_id, imported_by, import_date, status, total_amount, notes, ...)
medicine_import_items (id, import_id, medicine_id, batch_number, expiry_date, quantity, unit_price, subtotal)
```

Tất cả bảng có `created_at`, `updated_at`, `deleted_at` (soft delete) thông qua `BaseEntity`.

## Phân quyền

Quyền hiệu lực của user = `(union(quyền từ tất cả role) ∪ direct ALLOW) - direct DENY`

- Mỗi route được bảo vệ bởi `@RequirePermissions(...)` + `PermissionsGuard`.
- Frontend dùng `<PermissionGate permission={...}>` để ẩn/hiện UI.
- Super admin có toàn bộ quyền, mặc định được tạo bởi seeder.

System roles được seed sẵn:
- `super_admin` - toàn quyền (kể cả cấp quyền trực tiếp cho user)
- `admin` - quản trị, không có quyền cấp trực tiếp
- `pharmacist` - dược sĩ, quản lý thuốc và nhập kho
- `staff` - nhân viên, chỉ đọc

## Chạy dự án

### 1. Database

```bash
docker run --name pharmacy-db -e POSTGRES_PASSWORD=postgres -e POSTGRES_USER=postgres -e POSTGRES_DB=pharmacy -p 5432:5432 -d postgres:16
```

### 2. Backend

```bash
cd backend
cp .env.example .env       
npm install
npm run start:dev          # http://localhost:3000/api/v1
```

Lần chạy đầu, seeder sẽ tạo:
- Permissions (tất cả từ `PERMISSIONS` constant)
- System roles (super_admin, admin, pharmacist, staff)
- Super admin user: `admin@example.com` / `Admin@123`

### 3. Frontend

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev                # http://localhost:3001
```

Đăng nhập với `admin@example.com` / `Admin@123`.

## Testing

```bash
# Backend - 33 unit tests
cd backend && npm test

# Frontend - 35 unit + component tests
cd frontend && npm test
```

## API endpoints (mã đầu chung: `/api/v1`)

| Method | Path | Permission |
|---|---|---|
| POST | `/auth/login` | public |
| POST | `/auth/register` | public |
| GET  | `/auth/me` | authenticated |
| GET/POST/PATCH/DELETE | `/users[/:id]` | `user:*` |
| POST | `/users/:id/roles` | `user:assign_role` |
| POST | `/users/:id/permissions` | `user:grant_permission` |
| GET/POST/PATCH/DELETE | `/roles[/:id]` | `role:*` |
| GET  | `/permissions[/grouped]` | `permission:read` |
| GET/POST/PATCH/DELETE | `/medicines[/:id]` | `medicine:*` |
| GET/POST/PATCH/DELETE | `/medicines/categories[/:id]` | `medicine_category:*` |
| GET/POST/PATCH/DELETE | `/medicine-imports[/:id]` | `medicine_import:*` |
| POST | `/medicine-imports/:id/complete` | `medicine_import:complete` |
| POST | `/medicine-imports/:id/cancel` | `medicine_import:update` |
| GET/POST/PATCH/DELETE | `/suppliers[/:id]` | `supplier:*` |

## Best-practice tuân thủ

- **SOLID**:
  - SRP: mỗi service làm một việc (Auth chỉ auth, Users chỉ user, ...)
  - OCP: thêm quyền mới chỉ cần bổ sung vào `PERMISSIONS` constant + seed
  - LSP: tất cả entity kế thừa `BaseEntity` đều có cùng contract (id, timestamps, soft delete)
  - ISP: DTO tách create/update riêng, không bắt client truyền field thừa
  - DIP: dùng `@InjectRepository`, không phụ thuộc cụ thể vào connection
- **DRY**:
  - `BaseEntity` cho timestamps
  - `PaginationDto` + `PaginatedResult<T>` dùng chung
  - `DataTable`, `PaginationControl`, `ConfirmDialog`, `PermissionGate` ở frontend
  - Permission constant định nghĩa 1 lần, mirror sang frontend
- **Transactional integrity**: nhập kho cập nhật stock trong cùng transaction; idempotent qua status check
- **Soft delete** mặc định trên mọi domain entity
