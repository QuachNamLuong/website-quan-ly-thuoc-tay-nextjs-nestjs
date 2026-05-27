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
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Spinner } from '@/components/common/spinner';
import { ApiError } from '@/lib/api/client';
import type { Permission, Role } from '@/lib/types';

export interface RoleFormValues {
  name: string;
  description?: string;
  permissionIds: string[];
}

interface RoleFormDialogProps {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  role?: Role | null;
  groupedPermissions: Record<string, Permission[]>;
  onSubmit: (data: RoleFormValues) => Promise<void>;
}

export function RoleFormDialog({
  open,
  onOpenChange,
  role,
  groupedPermissions,
  onSubmit,
}: RoleFormDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setError(null);
      setName(role?.name ?? '');
      setDescription(role?.description ?? '');
      setSelected(
        new Set(role?.rolePermissions?.map((rp) => rp.permission.id) ?? []),
      );
    }
  }, [open, role]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleGroup = (perms: Permission[]) => {
    setSelected((prev) => {
      const next = new Set(prev);
      const allSelected = perms.every((p) => next.has(p.id));
      perms.forEach((p) => {
        if (allSelected) next.delete(p.id);
        else next.add(p.id);
      });
      return next;
    });
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await onSubmit({
        name,
        description: description || undefined,
        permissionIds: Array.from(selected),
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
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{role ? 'Chỉnh sửa vai trò' : 'Tạo vai trò mới'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Tên vai trò *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={role?.isSystem}
                maxLength={50}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Mô tả</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={role?.isSystem}
              />
            </div>
          </div>

          <div>
            <Label className="mb-2 block">Quyền hạn</Label>
            <div className="border rounded-md max-h-96 overflow-y-auto p-3 space-y-3">
              {Object.entries(groupedPermissions).map(([resource, perms]) => {
                const allSel = perms.every((p) => selected.has(p.id));
                const someSel = perms.some((p) => selected.has(p.id));
                return (
                  <div key={resource}>
                    <div className="flex items-center gap-2 mb-1 font-medium text-sm">
                      <Checkbox
                        checked={allSel}
                        ref={(el) => {
                          if (el) el.indeterminate = !allSel && someSel;
                        }}
                        onChange={() => toggleGroup(perms)}
                        disabled={role?.isSystem}
                      />
                      <span className="capitalize">{resource.replace(/_/g, ' ')}</span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-1 ml-6">
                      {perms.map((p) => (
                        <label
                          key={p.id}
                          className="flex items-center gap-2 text-sm cursor-pointer"
                        >
                          <Checkbox
                            checked={selected.has(p.id)}
                            onChange={() => toggle(p.id)}
                            disabled={role?.isSystem}
                          />
                          <span className="font-mono text-xs">{p.action}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {error && (
            <p role="alert" className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
              {error}
            </p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Hủy
            </Button>
            <Button type="submit" disabled={isLoading || role?.isSystem}>
              {isLoading && <Spinner />}
              {role ? 'Cập nhật' : 'Tạo mới'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
