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
import { suppliersApi } from '@/lib/api/resources';
import { ApiError } from '@/lib/api/client';
import { PERMISSIONS, type Supplier } from '@/lib/types';
import {
  SupplierFormDialog,
  type SupplierFormValues,
} from '@/components/medicines/supplier-form-dialog';

export default function SuppliersPage() {
  const toast = useToast();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [isLoading, setLoading] = useState(true);

  const [editing, setEditing] = useState<Supplier | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [deleting, setDeleting] = useState<Supplier | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await suppliersApi.list({ page, limit: 20, search });
      setSuppliers(res.data);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Lỗi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  }, [page, search, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSubmit = async (values: SupplierFormValues) => {
    if (editing) {
      await suppliersApi.update(editing.id, values);
      toast.success('Cập nhật nhà cung cấp thành công');
    } else {
      await suppliersApi.create(values);
      toast.success('Tạo nhà cung cấp thành công');
    }
    await load();
  };

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      await suppliersApi.remove(deleting.id);
      toast.success('Đã xóa nhà cung cấp');
      await load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Không thể xóa');
    }
  };

  const columns: Column<Supplier>[] = [
    { key: 'name', header: 'Tên', render: (s) => <span className="font-medium">{s.name}</span> },
    { key: 'email', header: 'Email', render: (s) => s.email ?? '-' },
    { key: 'phone', header: 'Điện thoại', render: (s) => s.phone ?? '-' },
    { key: 'taxCode', header: 'MST', render: (s) => s.taxCode ?? '-' },
    {
      key: 'isActive',
      header: 'Trạng thái',
      render: (s) =>
        s.isActive ? (
          <Badge variant="success">Hoạt động</Badge>
        ) : (
          <Badge variant="secondary">Tạm ngưng</Badge>
        ),
    },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (s) => (
        <div className="flex justify-end gap-2">
          <PermissionGate permission={PERMISSIONS.SUPPLIER_UPDATE}>
            <Button size="sm" variant="outline" onClick={() => { setEditing(s); setFormOpen(true); }}>
              Sửa
            </Button>
          </PermissionGate>
          <PermissionGate permission={PERMISSIONS.SUPPLIER_DELETE}>
            <Button size="sm" variant="destructive" onClick={() => setDeleting(s)}>
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
        title="Nhà cung cấp"
        description="Quản lý danh sách nhà cung cấp thuốc"
        actions={
          <PermissionGate permission={PERMISSIONS.SUPPLIER_CREATE}>
            <Button onClick={() => { setEditing(null); setFormOpen(true); }}>
              + Thêm nhà cung cấp
            </Button>
          </PermissionGate>
        }
      />

      <div className="mb-4">
        <Input
          placeholder="Tìm theo tên, email, điện thoại..."
          value={search}
          onChange={(e) => { setPage(1); setSearch(e.target.value); }}
          className="max-w-md"
        />
      </div>

      <DataTable
        columns={columns}
        data={suppliers}
        isLoading={isLoading}
        rowKey={(s) => s.id}
      />

      <div className="mt-4">
        <PaginationControl
          page={page}
          totalPages={totalPages}
          total={total}
          onPageChange={setPage}
        />
      </div>

      <SupplierFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        supplier={editing}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Xóa nhà cung cấp"
        description={`Bạn có chắc muốn xóa "${deleting?.name}"?`}
        confirmText="Xóa"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </div>
  );
}
