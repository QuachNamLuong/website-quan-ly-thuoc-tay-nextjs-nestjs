'use client';

import { useEffect, useState, type FormEvent } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Spinner } from '@/components/common/spinner';
import { ApiError } from '@/lib/api/client';
import type { Supplier } from '@/lib/types';

export interface SupplierFormValues {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  taxCode?: string;
  isActive: boolean;
}

interface SupplierFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplier?: Supplier | null;
  onSubmit: (data: SupplierFormValues) => Promise<void>;
}

const DEFAULT: SupplierFormValues = {
  name: '',
  email: '',
  phone: '',
  address: '',
  taxCode: '',
  isActive: true,
};

export function SupplierFormDialog({
  open,
  onOpenChange,
  supplier,
  onSubmit,
}: SupplierFormProps) {
  const [values, setValues] = useState<SupplierFormValues>(DEFAULT);
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setError(null);
      setValues(
        supplier
          ? {
              name: supplier.name,
              email: supplier.email ?? '',
              phone: supplier.phone ?? '',
              address: supplier.address ?? '',
              taxCode: supplier.taxCode ?? '',
              isActive: supplier.isActive,
            }
          : DEFAULT,
      );
    }
  }, [open, supplier]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await onSubmit({
        ...values,
        email: values.email || undefined,
        phone: values.phone || undefined,
        address: values.address || undefined,
        taxCode: values.taxCode || undefined,
      });
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {supplier ? 'Chỉnh sửa nhà cung cấp' : 'Thêm nhà cung cấp'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Tên nhà cung cấp *</Label>
            <Input
              id="name"
              value={values.name}
              onChange={(e) => setValues({ ...values, name: e.target.value })}
              required
              maxLength={200}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={values.email}
                onChange={(e) => setValues({ ...values, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Điện thoại</Label>
              <Input
                id="phone"
                value={values.phone}
                onChange={(e) => setValues({ ...values, phone: e.target.value })}
                maxLength={20}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="taxCode">Mã số thuế</Label>
            <Input
              id="taxCode"
              value={values.taxCode}
              onChange={(e) => setValues({ ...values, taxCode: e.target.value })}
              maxLength={50}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Địa chỉ</Label>
            <Textarea
              id="address"
              value={values.address}
              onChange={(e) => setValues({ ...values, address: e.target.value })}
            />
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="isActive"
              checked={values.isActive}
              onChange={(e) =>
                setValues({ ...values, isActive: e.target.checked })
              }
            />
            <Label htmlFor="isActive" className="cursor-pointer">
              Đang hoạt động
            </Label>
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
              {supplier ? 'Cập nhật' : 'Tạo mới'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
