'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { DataTable, type Column } from '@/components/common/data-table';
import { PaginationControl } from '@/components/common/pagination';
import { PermissionGate } from '@/components/common/permission-gate';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { Spinner } from '@/components/common/spinner';
import { useToast } from '@/components/common/toast';
import {
  medicineImportsApi,
  medicinesApi,
  suppliersApi,
} from '@/lib/api/resources';
import { ApiError } from '@/lib/api/client';
import {
  PERMISSIONS,
  type Medicine,
  type MedicineImport,
  type Supplier,
} from '@/lib/types';
import { formatCurrency, formatDate, STATUS_LABELS } from '@/lib/utils/format';

interface ItemRow {
  medicineId: string;
  batchNumber: string;
  expiryDate: string;
  quantity: number;
  unitPrice: number;
}

const EMPTY_ROW: ItemRow = {
  medicineId: '',
  batchNumber: '',
  expiryDate: '',
  quantity: 1,
  unitPrice: 0,
};

function ImportFormDialog({
  open,
  onOpenChange,
  suppliers,
  medicines,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  suppliers: Supplier[];
  medicines: Medicine[];
  onSubmit: () => Promise<void> | void;
}) {
  const toast = useToast();
  const [supplierId, setSupplierId] = useState('');
  const [importDate, setImportDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<ItemRow[]>([{ ...EMPTY_ROW }]);
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setSupplierId('');
      setImportDate(new Date().toISOString().slice(0, 10));
      setNotes('');
      setItems([{ ...EMPTY_ROW }]);
      setError(null);
    }
  }, [open]);

  const updateItem = (idx: number, patch: Partial<ItemRow>) => {
    setItems((prev) =>
      prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)),
    );
  };

  const total = items.reduce(
    (sum, it) => sum + (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0),
    0,
  );

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!supplierId) {
      setError('Vui lòng chọn nhà cung cấp');
      return;
    }
    if (items.some((it) => !it.medicineId || !it.batchNumber || !it.expiryDate)) {
      setError('Vui lòng điền đầy đủ thông tin các dòng');
      return;
    }

    setLoading(true);
    try {
      await medicineImportsApi.create({
        supplierId,
        importDate,
        notes: notes || undefined,
        items: items.map((it) => ({
          medicineId: it.medicineId,
          batchNumber: it.batchNumber,
          expiryDate: it.expiryDate,
          quantity: Number(it.quantity),
          unitPrice: Number(it.unitPrice),
        })),
      });
      toast.success('Tạo phiếu nhập thành công');
      await onSubmit();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Tạo phiếu nhập thuốc</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="supplier">Nhà cung cấp *</Label>
              <Select
                id="supplier"
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
                required
              >
                <option value="">-- Chọn nhà cung cấp --</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="importDate">Ngày nhập *</Label>
              <Input
                id="importDate"
                type="date"
                value={importDate}
                onChange={(e) => setImportDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Chi tiết phiếu nhập</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setItems([...items, { ...EMPTY_ROW }])}
              >
                + Thêm dòng
              </Button>
            </div>
            <div className="border rounded-md overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-2">Thuốc *</th>
                    <th className="text-left p-2">Số lô *</th>
                    <th className="text-left p-2">HSD *</th>
                    <th className="text-right p-2 w-24">SL *</th>
                    <th className="text-right p-2 w-32">Đơn giá *</th>
                    <th className="text-right p-2 w-32">Thành tiền</th>
                    <th className="w-10" />
                  </tr>
                </thead>
                <tbody>
                  {items.map((it, idx) => {
                    const subtotal =
                      (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0);
                    return (
                      <tr key={idx} className="border-t">
                        <td className="p-2">
                          <Select
                            value={it.medicineId}
                            onChange={(e) =>
                              updateItem(idx, { medicineId: e.target.value })
                            }
                            required
                          >
                            <option value="">-- Chọn thuốc --</option>
                            {medicines.map((m) => (
                              <option key={m.id} value={m.id}>
                                {m.code} - {m.name}
                              </option>
                            ))}
                          </Select>
                        </td>
                        <td className="p-2">
                          <Input
                            value={it.batchNumber}
                            onChange={(e) =>
                              updateItem(idx, { batchNumber: e.target.value })
                            }
                            required
                          />
                        </td>
                        <td className="p-2">
                          <Input
                            type="date"
                            value={it.expiryDate}
                            onChange={(e) =>
                              updateItem(idx, { expiryDate: e.target.value })
                            }
                            required
                          />
                        </td>
                        <td className="p-2">
                          <Input
                            type="number"
                            min="1"
                            value={it.quantity}
                            onChange={(e) =>
                              updateItem(idx, { quantity: Number(e.target.value) })
                            }
                            required
                            className="text-right"
                          />
                        </td>
                        <td className="p-2">
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={it.unitPrice}
                            onChange={(e) =>
                              updateItem(idx, { unitPrice: Number(e.target.value) })
                            }
                            required
                            className="text-right"
                          />
                        </td>
                        <td className="p-2 text-right font-medium">
                          {formatCurrency(subtotal)}
                        </td>
                        <td className="p-2">
                          {items.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              aria-label="Xóa dòng"
                              onClick={() =>
                                setItems(items.filter((_, i) => i !== idx))
                              }
                            >
                              ✕
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-muted/30">
                  <tr>
                    <td colSpan={5} className="p-2 text-right font-medium">
                      Tổng cộng:
                    </td>
                    <td className="p-2 text-right font-bold">
                      {formatCurrency(total)}
                    </td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Ghi chú</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {error && (
            <p role="alert" className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
              {error}
            </p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Spinner />}
              Tạo phiếu
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'completed') return <Badge variant="success">{STATUS_LABELS[status]}</Badge>;
  if (status === 'cancelled') return <Badge variant="destructive">{STATUS_LABELS[status]}</Badge>;
  return <Badge variant="warning">{STATUS_LABELS[status] ?? status}</Badge>;
}

export default function MedicineImportsPage() {
  const toast = useToast();
  const [imports, setImports] = useState<MedicineImport[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [isLoading, setLoading] = useState(true);

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);

  const [formOpen, setFormOpen] = useState(false);
  const [completing, setCompleting] = useState<MedicineImport | null>(null);
  const [cancelling, setCancelling] = useState<MedicineImport | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await medicineImportsApi.list({ page, limit: 20, search });
      setImports(res.data);
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
    void suppliersApi.listAll().then(setSuppliers).catch(() => {});
    void medicinesApi
      .list({ page: 1, limit: 100, isActive: true })
      .then((r) => setMedicines(r.data))
      .catch(() => {});
  }, []);

  const handleComplete = async () => {
    if (!completing) return;
    try {
      await medicineImportsApi.complete(completing.id);
      toast.success('Phiếu nhập đã được hoàn tất, kho đã cập nhật');
      await load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Không thể hoàn tất');
    }
  };

  const handleCancel = async () => {
    if (!cancelling) return;
    try {
      await medicineImportsApi.cancel(cancelling.id);
      toast.success('Đã hủy phiếu nhập');
      await load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Không thể hủy');
    }
  };

  const columns: Column<MedicineImport>[] = [
    {
      key: 'importCode',
      header: 'Mã phiếu',
      render: (i) => (
        <Link
          href={`/dashboard/medicine-imports/${i.id}`}
          className="font-mono text-xs text-primary hover:underline"
        >
          {i.importCode}
        </Link>
      ),
    },
    { key: 'supplier', header: 'Nhà cung cấp', render: (i) => i.supplier?.name ?? '-' },
    { key: 'date', header: 'Ngày nhập', render: (i) => formatDate(i.importDate) },
    {
      key: 'total',
      header: 'Tổng tiền',
      className: 'text-right',
      render: (i) => formatCurrency(i.totalAmount),
    },
    { key: 'status', header: 'Trạng thái', render: (i) => <StatusBadge status={i.status} /> },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (i) => (
        <div className="flex justify-end gap-2">
          {i.status === 'pending' && (
            <>
              <PermissionGate permission={PERMISSIONS.MEDICINE_IMPORT_COMPLETE}>
                <Button size="sm" onClick={() => setCompleting(i)}>
                  Hoàn tất
                </Button>
              </PermissionGate>
              <PermissionGate permission={PERMISSIONS.MEDICINE_IMPORT_UPDATE}>
                <Button size="sm" variant="outline" onClick={() => setCancelling(i)}>
                  Hủy
                </Button>
              </PermissionGate>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Phiếu nhập thuốc"
        description="Quản lý phiếu nhập kho từ nhà cung cấp"
        actions={
          <PermissionGate permission={PERMISSIONS.MEDICINE_IMPORT_CREATE}>
            <Button onClick={() => setFormOpen(true)}>+ Tạo phiếu nhập</Button>
          </PermissionGate>
        }
      />

      <div className="mb-4">
        <Input
          placeholder="Tìm theo mã phiếu hoặc nhà cung cấp..."
          value={search}
          onChange={(e) => { setPage(1); setSearch(e.target.value); }}
          className="max-w-md"
        />
      </div>

      <DataTable
        columns={columns}
        data={imports}
        isLoading={isLoading}
        rowKey={(i) => i.id}
        emptyMessage="Chưa có phiếu nhập nào"
      />

      <div className="mt-4">
        <PaginationControl
          page={page}
          totalPages={totalPages}
          total={total}
          onPageChange={setPage}
        />
      </div>

      <ImportFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        suppliers={suppliers}
        medicines={medicines}
        onSubmit={load}
      />

      <ConfirmDialog
        open={!!completing}
        onOpenChange={(o) => !o && setCompleting(null)}
        title="Hoàn tất phiếu nhập"
        description={`Xác nhận hoàn tất phiếu ${completing?.importCode}? Tồn kho sẽ được cập nhật và không thể hoàn tác.`}
        onConfirm={handleComplete}
      />

      <ConfirmDialog
        open={!!cancelling}
        onOpenChange={(o) => !o && setCancelling(null)}
        title="Hủy phiếu nhập"
        description={`Xác nhận hủy phiếu ${cancelling?.importCode}?`}
        variant="destructive"
        onConfirm={handleCancel}
      />
    </div>
  );
}
