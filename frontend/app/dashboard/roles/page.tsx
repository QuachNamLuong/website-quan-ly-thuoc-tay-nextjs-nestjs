'use client';

import { useCallback, useEffect, useState } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable, type Column } from '@/components/common/data-table';
import { PermissionGate } from '@/components/common/permission-gate';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { useToast } from '@/components/common/toast';
import { permissionsApi, rolesApi } from '@/lib/api/resources';
import { ApiError } from '@/lib/api/client';
import { PERMISSIONS, type Permission, type Role } from '@/lib/types';
import {
  RoleFormDialog,
  type RoleFormValues,
} from '@/components/roles/role-form-dialog';

export default function RolesPage() {
  const toast = useToast();
  const [roles, setRoles] = useState<Role[]>([]);
  const [grouped, setGrouped] = useState<Record<string, Permission[]>>({});
  const [isLoading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Role | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [deleting, setDeleting] = useState<Role | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await rolesApi.list();
      setRoles(data);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Lỗi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    void permissionsApi.grouped().then(setGrouped).catch(() => {});
  }, []);

  const handleSubmit = async (values: RoleFormValues) => {
    if (editing) {
      await rolesApi.update(editing.id, values);
      toast.success('Cập nhật vai trò thành công');
    } else {
      await rolesApi.create(values);
      toast.success('Tạo vai trò thành công');
    }
    await load();
  };

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      await rolesApi.remove(deleting.id);
      toast.success('Đã xóa vai trò');
      await load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Không thể xóa');
    }
  };

  const columns: Column<Role>[] = [
    {
      key: 'name',
      header: 'Tên vai trò',
      render: (r) => (
        <div className="flex items-center gap-2">
          <span className="font-medium">{r.name}</span>
          {r.isSystem && <Badge variant="outline">Hệ thống</Badge>}
        </div>
      ),
    },
    {
      key: 'description',
      header: 'Mô tả',
      render: (r) => <span className="text-muted-foreground">{r.description ?? '-'}</span>,
    },
    {
      key: 'permissions',
      header: 'Số quyền',
      className: 'text-center',
      render: (r) => <span>{r.rolePermissions?.length ?? 0}</span>,
    },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (r) => (
        <div className="flex justify-end gap-2">
          <PermissionGate permission={PERMISSIONS.ROLE_UPDATE}>
            <Button
              size="sm"
              variant="outline"
              onClick={() => { setEditing(r); setFormOpen(true); }}
              disabled={r.isSystem}
              title={r.isSystem ? 'Không thể chỉnh sửa vai trò hệ thống' : undefined}
            >
              Sửa
            </Button>
          </PermissionGate>
          <PermissionGate permission={PERMISSIONS.ROLE_DELETE}>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => setDeleting(r)}
              disabled={r.isSystem}
            >
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
        title="Vai trò"
        description="Quản lý vai trò và quyền hạn của vai trò"
        actions={
          <PermissionGate permission={PERMISSIONS.ROLE_CREATE}>
            <Button onClick={() => { setEditing(null); setFormOpen(true); }}>
              + Tạo vai trò
            </Button>
          </PermissionGate>
        }
      />

      <DataTable
        columns={columns}
        data={roles}
        isLoading={isLoading}
        rowKey={(r) => r.id}
      />

      <RoleFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        role={editing}
        groupedPermissions={grouped}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Xóa vai trò"
        description={`Bạn có chắc muốn xóa vai trò "${deleting?.name}"?`}
        variant="destructive"
        confirmText="Xóa"
        onConfirm={handleDelete}
      />
    </div>
  );
}
