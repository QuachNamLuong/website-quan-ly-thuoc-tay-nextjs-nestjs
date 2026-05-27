'use client';

import { useCallback, useEffect, useState } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DataTable, type Column } from '@/components/common/data-table';
import { PaginationControl } from '@/components/common/pagination';
import { PermissionGate } from '@/components/common/permission-gate';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { useToast } from '@/components/common/toast';
import { permissionsApi, rolesApi, usersApi } from '@/lib/api/resources';
import { ApiError } from '@/lib/api/client';
import {
  PERMISSIONS,
  type Permission,
  type Role,
  type User,
} from '@/lib/types';
import {
  UserFormDialog,
  type UserFormValues,
} from '@/components/users/user-form-dialog';
import { UserPermissionsDialog } from '@/components/users/user-permissions-dialog';
import { formatDateTime } from '@/lib/utils/format';

export default function UsersPage() {
  const toast = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [isLoading, setLoading] = useState(true);

  const [roles, setRoles] = useState<Role[]>([]);
  const [grouped, setGrouped] = useState<Record<string, Permission[]>>({});

  const [editing, setEditing] = useState<User | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [permissionsUser, setPermissionsUser] = useState<User | null>(null);
  const [deleting, setDeleting] = useState<User | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await usersApi.list({ page, limit: 20, search });
      setUsers(res.data);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Lỗi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  }, [page, search, toast]);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    void rolesApi.list().then(setRoles).catch(() => {});
    void permissionsApi.grouped().then(setGrouped).catch(() => {});
  }, []);

  const handleSubmit = async (values: UserFormValues) => {
    if (editing) {
      await usersApi.update(editing.id, {
        email: values.email,
        username: values.username,
        fullName: values.fullName,
        isActive: values.isActive,
        ...(values.password ? { password: values.password } : {}),
      });
      await usersApi.assignRoles(editing.id, values.roleIds);
      toast.success('Cập nhật người dùng thành công');
    } else {
      await usersApi.create({
        email: values.email,
        username: values.username,
        password: values.password ?? '',
        fullName: values.fullName,
        isActive: values.isActive,
        roleIds: values.roleIds,
      });
      toast.success('Tạo người dùng thành công');
    }
    await load();
  };

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      await usersApi.remove(deleting.id);
      toast.success('Đã xóa người dùng');
      await load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Không thể xóa');
    }
  };

  const handleSavePermissions = async (
    grants: Array<{ permissionId: string; effect: 'allow' | 'deny' }>,
  ) => {
    if (!permissionsUser) return;
    await usersApi.grantPermissions(permissionsUser.id, grants);
    toast.success('Cập nhật quyền thành công');
    await load();
  };

  const openEdit = async (user: User) => {
    try {
      const full = await usersApi.get(user.id);
      setEditing(full);
      setFormOpen(true);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Lỗi tải dữ liệu');
    }
  };

  const openPermissions = async (user: User) => {
    try {
      const full = await usersApi.get(user.id);
      setPermissionsUser(full);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Lỗi tải dữ liệu');
    }
  };

  const columns: Column<User>[] = [
    {
      key: 'fullName',
      header: 'Họ tên',
      render: (u) => (
        <div>
          <p className="font-medium">{u.fullName}</p>
          <p className="text-xs text-muted-foreground">@{u.username}</p>
        </div>
      ),
    },
    { key: 'email', header: 'Email', render: (u) => u.email },
    {
      key: 'roles',
      header: 'Vai trò',
      render: (u) => (
        <div className="flex flex-wrap gap-1">
          {u.userRoles?.length
            ? u.userRoles.map((ur) => (
                <Badge key={ur.role.id} variant="secondary">{ur.role.name}</Badge>
              ))
            : <span className="text-muted-foreground text-xs">-</span>}
        </div>
      ),
    },
    {
      key: 'lastLogin',
      header: 'Đăng nhập gần nhất',
      render: (u) => <span className="text-xs">{formatDateTime(u.lastLoginAt)}</span>,
    },
    {
      key: 'isActive',
      header: 'Trạng thái',
      render: (u) =>
        u.isActive ? <Badge variant="success">Hoạt động</Badge> : <Badge variant="secondary">Tạm khóa</Badge>,
    },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (u) => (
        <div className="flex justify-end gap-2">
          <PermissionGate permission={PERMISSIONS.USER_UPDATE}>
            <Button size="sm" variant="outline" onClick={() => openEdit(u)}>
              Sửa
            </Button>
          </PermissionGate>
          <PermissionGate permission={PERMISSIONS.USER_GRANT_PERMISSION}>
            <Button size="sm" variant="outline" onClick={() => openPermissions(u)}>
              Quyền
            </Button>
          </PermissionGate>
          <PermissionGate permission={PERMISSIONS.USER_DELETE}>
            <Button size="sm" variant="destructive" onClick={() => setDeleting(u)}>
              Xóa
            </Button>
          </PermissionGate>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Người dùng"
        description="Quản lý tài khoản người dùng và phân quyền"
        actions={
          <PermissionGate permission={PERMISSIONS.USER_CREATE}>
            <Button onClick={() => { setEditing(null); setFormOpen(true); }}>
              + Thêm người dùng
            </Button>
          </PermissionGate>
        }
      />

      <div className="mb-4">
        <Input
          placeholder="Tìm theo họ tên, email, tên đăng nhập..."
          value={search}
          onChange={(e) => { setPage(1); setSearch(e.target.value); }}
          className="max-w-md"
        />
      </div>

      <DataTable
        columns={columns}
        data={users}
        isLoading={isLoading}
        rowKey={(u) => u.id}
      />

      <div className="mt-4">
        <PaginationControl
          page={page}
          totalPages={totalPages}
          total={total}
          onPageChange={setPage}
        />
      </div>

      <UserFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        user={editing}
        roles={roles}
        onSubmit={handleSubmit}
      />

      {permissionsUser && (
        <UserPermissionsDialog
          open={!!permissionsUser}
          onOpenChange={(o) => !o && setPermissionsUser(null)}
          user={permissionsUser}
          groupedPermissions={grouped}
          onSubmit={handleSavePermissions}
        />
      )}

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Xóa người dùng"
        description={`Bạn có chắc muốn xóa "${deleting?.fullName}"?`}
        variant="destructive"
        confirmText="Xóa"
        onConfirm={handleDelete}
      />
    </div>
  );
}
