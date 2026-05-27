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
import { Select } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Spinner } from '@/components/common/spinner';
import { ApiError } from '@/lib/api/client';
import type { Medicine, MedicineCategory, MedicineUnit } from '@/lib/types';
import { UNIT_LABELS } from '@/lib/utils/format';

interface MedicineFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  medicine?: Medicine | null;
  categories: MedicineCategory[];
  onSubmit: (data: MedicineFormValues) => Promise<void>;
}

export interface MedicineFormValues {
  code: string;
  name: string;
  genericName?: string;
  manufacturer?: string;
  unit: MedicineUnit;
  price: number;
  description?: string;
  isActive: boolean;
  categoryId?: string;
}

const DEFAULT: MedicineFormValues = {
  code: '',
  name: '',
  genericName: '',
  manufacturer: '',
  unit: 'tablet',
  price: 0,
  description: '',
  isActive: true,
  categoryId: '',
};

export function MedicineFormDialog({
  open,
  onOpenChange,
  medicine,
  categories,
  onSubmit,
}: MedicineFormProps) {
  const [values, setValues] = useState<MedicineFormValues>(DEFAULT);
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setError(null);
      setValues(
        medicine
          ? {
              code: medicine.code,
              name: medicine.name,
              genericName: medicine.genericName ?? '',
              manufacturer: medicine.manufacturer ?? '',
              unit: medicine.unit,
              price: Number(medicine.price),
              description: medicine.description ?? '',
              isActive: medicine.isActive,
              categoryId: medicine.categoryId ?? '',
            }
          : DEFAULT,
      );
    }
  }, [open, medicine]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await onSubmit({
        ...values,
        categoryId: values.categoryId || undefined,
        genericName: values.genericName || undefined,
        manufacturer: values.manufacturer || undefined,
        description: values.description || undefined,
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
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {medicine ? 'Chỉnh sửa thuốc' : 'Thêm thuốc mới'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="code">Mã thuốc *</Label>
              <Input
                id="code"
                value={values.code}
                onChange={(e) => setValues({ ...values, code: e.target.value })}
                required
                maxLength={50}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Tên thuốc *</Label>
              <Input
                id="name"
                value={values.name}
                onChange={(e) => setValues({ ...values, name: e.target.value })}
                required
                maxLength={200}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="genericName">Tên hoạt chất</Label>
              <Input
                id="genericName"
                value={values.genericName}
                onChange={(e) =>
                  setValues({ ...values, genericName: e.target.value })
                }
                maxLength={200}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="manufacturer">Nhà sản xuất</Label>
              <Input
                id="manufacturer"
                value={values.manufacturer}
                onChange={(e) =>
                  setValues({ ...values, manufacturer: e.target.value })
                }
                maxLength={200}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="unit">Đơn vị *</Label>
              <Select
                id="unit"
                value={values.unit}
                onChange={(e) =>
                  setValues({ ...values, unit: e.target.value as MedicineUnit })
                }
                required
              >
                {Object.entries(UNIT_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Giá bán *</Label>
              <Input
                id="price"
                type="number"
                min="0"
                step="0.01"
                value={values.price}
                onChange={(e) =>
                  setValues({ ...values, price: Number(e.target.value) })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="categoryId">Nhóm thuốc</Label>
              <Select
                id="categoryId"
                value={values.categoryId}
                onChange={(e) =>
                  setValues({ ...values, categoryId: e.target.value })
                }
              >
                <option value="">-- Không chọn --</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Mô tả</Label>
            <Textarea
              id="description"
              value={values.description}
              onChange={(e) =>
                setValues({ ...values, description: e.target.value })
              }
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
              {medicine ? 'Cập nhật' : 'Tạo mới'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
