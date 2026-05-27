'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { PageLoader } from '@/components/common/spinner';
import { PermissionGate } from '@/components/common/permission-gate';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { useToast } from '@/components/common/toast';
import { medicineImportsApi } from '@/lib/api/resources';
import { ApiError } from '@/lib/api/client';
import { PERMISSIONS, type MedicineImport } from '@/lib/types';
import { formatCurrency, formatDate, STATUS_LABELS } from '@/lib/utils/format';

export default function MedicineImportDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();
  const [imp, setImp] = useState<MedicineImport | null>(null);
  const [isLoading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);

  const load = useCallback(async () => {
    if (!params.id) return;
    setLoading(true);
    try {
      const data = await medicineImportsApi.get(params.id);
      setImp(data);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Lỗi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  }, [params.id, toast]);

  useEffect(() => { void load(); }, [load]);

  if (isLoading) return <PageLoader />;
  if (!imp) return null;

  const statusBadge =
    imp.status === 'completed' ? (
      <Badge variant="success">{STATUS_LABELS.completed}</Badge>
    ) : imp.status === 'cancelled' ? (
      <Badge variant="destructive">{STATUS_LABELS.cancelled}</Badge>
    ) : (
      <Badge variant="warning">{STATUS_LABELS.pending}</Badge>
    );

  return (
    <div>
      <PageHeader
        title={`Phiếu nhập ${imp.importCode}`}
        description="Chi tiết phiếu nhập thuốc"
        actions={
          <Button variant="outline" onClick={() => router.back()}>
            ← Quay lại
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Thông tin chung</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Trạng thái:</span> {statusBadge}</div>
            <div className="flex justify-between"><span className="text-muted-foreground">Nhà cung cấp:</span> <span className="font-medium">{imp.supplier?.name}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Ngày nhập:</span> <span>{formatDate(imp.importDate)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Người tạo:</span> <span>{imp.importer?.fullName ?? '-'}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Tổng tiền:</span> <span className="font-bold">{formatCurrency(imp.totalAmount)}</span></div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Ghi chú</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {imp.notes || 'Không có ghi chú'}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Chi tiết mặt hàng</CardTitle>
          {imp.status === 'pending' && (
            <PermissionGate permission={PERMISSIONS.MEDICINE_IMPORT_COMPLETE}>
              <Button onClick={() => setCompleting(true)}>Hoàn tất phiếu nhập</Button>
            </PermissionGate>
          )}
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Thuốc</TableHead>
                <TableHead>Số lô</TableHead>
                <TableHead>HSD</TableHead>
                <TableHead className="text-right">SL</TableHead>
                <TableHead className="text-right">Đơn giá</TableHead>
                <TableHead className="text-right">Thành tiền</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {imp.items?.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{item.medicine?.name}</p>
                      <p className="text-xs text-muted-foreground font-mono">{item.medicine?.code}</p>
                    </div>
                  </TableCell>
                  <TableCell>{item.batchNumber}</TableCell>
                  <TableCell>{formatDate(item.expiryDate)}</TableCell>
                  <TableCell className="text-right">{item.quantity}</TableCell>
                  <TableCell className="text-right">{formatCurrency(item.unitPrice)}</TableCell>
                  <TableCell className="text-right font-medium">{formatCurrency(item.subtotal)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={completing}
        onOpenChange={setCompleting}
        title="Hoàn tất phiếu nhập"
        description="Tồn kho sẽ được cập nhật và không thể hoàn tác. Bạn có chắc chắn không?"
        onConfirm={async () => {
          try {
            await medicineImportsApi.complete(imp.id);
            toast.success('Đã hoàn tất phiếu nhập');
            await load();
          } catch (err) {
            toast.error(err instanceof ApiError ? err.message : 'Không thể hoàn tất');
          }
        }}
      />
    </div>
  );
}
