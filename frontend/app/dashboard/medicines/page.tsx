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
import { medicinesApi } from '@/lib/api/resources';
import { ApiError } from '@/lib/api/client';
import { PERMISSIONS } from '@/lib/types';
import type { Medicine, MedicineCategory } from '@/lib/types';
import { formatCurrency, UNIT_LABELS } from '@/lib/utils/format';
import {
  MedicineFormDialog,
  type MedicineFormValues,
} from '@/components/medicines/medicine-form-dialog';

export default function MedicinesPage() {
  const toast = useToast();
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [categories, setCategories] = useState<MedicineCategory[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [isLoading, setLoading] = useState(true);

  const [editing, setEditing] = useState<Medicine | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [deleting, setDeleting] = useState<Medicine | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await medicinesApi.list({ page, limit: 20, search });
      setMedicines(res.data);
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

  useEffect(() => {
    void medicinesApi.listCategories().then(setCategories).catch(() => {});
  }, []);

  const handleSubmit = async (values: MedicineFormValues) => {
    if (editing) {
      await medicinesApi.update(editing.id, values);
      toast.success('Cập nhật thuốc thành công');
    } else {
      await medicinesApi.create(values);
      toast.success('Tạo thuốc mới thành công');
    }
    await load();
  };

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      await medicinesApi.remove(deleting.id);
      toast.success('Đã xóa thuốc');
      await load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Không thể xóa');
    }
  };

  const columns: Column<Medicine>[] = [
    { key: 'code', header: 'Mã', render: (m) => <span className="font-mono text-xs">{m.code}</span> },
    {
      key: 'name',
      header: 'Tên thuốc',
      render: (m) => (
        <div>
          <p className="font-medium">{m.name}</p>
          {m.genericName && (
            <p className="text-xs text-muted-foreground">{m.genericName}</p>
          )}
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Nhóm',
      render: (m) => m.category?.name ?? '-',
    },
    { key: 'unit', header: 'Đơn vị', render: (m) => UNIT_LABELS[m.unit] ?? m.unit },
    {
      key: 'price',
      header: 'Giá',
      className: 'text-right',
      render: (m) => formatCurrency(m.price),
    },
    {
      key: 'stock',
      header: 'Tồn kho',
      className: 'text-right',
      render: (m) => <span>{m.stockQuantity}</span>,
    },
    {
      key: 'isActive',
      header: 'Trạng thái',
      render: (m) =>
        m.isActive ? (
          <Badge variant="success">Hoạt động</Badge>
        ) : (
          <Badge variant="secondary">Tạm ngưng</Badge>
        ),
    },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (m) => (
        <div className="flex justify-end gap-2">
          <PermissionGate permission={PERMISSIONS.MEDICINE_UPDATE}>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setEditing(m);
                setFormOpen(true);
              }}
            >
              Sửa
            </Button>
          </PermissionGate>
          <PermissionGate permission={PERMISSIONS.MEDICINE_DELETE}>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => setDeleting(m)}
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
        title="Quản lý thuốc"
        description="Danh sách thuốc trong kho"
        actions={
          <PermissionGate permission={PERMISSIONS.MEDICINE_CREATE}>
            <Button
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
            >
              + Thêm thuốc
            </Button>
          </PermissionGate>
        }
      />

      <div className="mb-4 flex gap-2">
        <Input
          placeholder="Tìm theo mã, tên thuốc, hoặc hoạt chất..."
          value={search}
          onChange={(e) => {
            setPage(1);
            setSearch(e.target.value);
          }}
          className="max-w-md"
        />
      </div>

      <DataTable
        columns={columns}
        data={medicines}
        isLoading={isLoading}
        rowKey={(m) => m.id}
        emptyMessage="Chưa có thuốc nào"
      />

      <div className="mt-4">
        <PaginationControl
          page={page}
          totalPages={totalPages}
          total={total}
          onPageChange={setPage}
        />
      </div>

      <MedicineFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        medicine={editing}
        categories={categories}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Xóa thuốc"
        description={`Bạn có chắc muốn xóa "${deleting?.name}"? Hành động này không thể hoàn tác.`}
        confirmText="Xóa"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </div>
  );
}
