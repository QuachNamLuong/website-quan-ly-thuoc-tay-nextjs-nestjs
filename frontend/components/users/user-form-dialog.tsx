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
import { Checkbox } from '@/components/ui/checkbox';
import { Spinner } from '@/components/common/spinner';
import { ApiError } from '@/lib/api/client';
import type { Role, User } from '@/lib/types';

export interface UserFormValues {
  email: string;
  username: string;
  password?: string;
  fullName: string;
  isActive: boolean;
  roleIds: string[];
}

interface UserFormProps {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  user?: User | null;
  roles: Role[];
  onSubmit: (data: UserFormValues) => Promise<void>;
}

export function UserFormDialog({
  open,
  onOpenChange,
  user,
  roles,
  onSubmit,
}: UserFormProps) {
  const [values, setValues] = useState<UserFormValues>({
    email: '',
    username: '',
    password: '',
    fullName: '',
    isActive: true,
    roleIds: [],
  });
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setError(null);
      setValues({
        email: user?.email ?? '',
        username: user?.username ?? '',
        password: '',
        fullName: user?.fullName ?? '',
        isActive: user?.isActive ?? true,
        roleIds: user?.userRoles?.map((ur) => ur.role.id) ?? [],
      });
    }
  }, [open, user]);

  const toggleRole = (id: string) => {
    setValues((prev) => ({
      ...prev,
      roleIds: prev.roleIds.includes(id)
        ? prev.roleIds.filter((r) => r !== id)
        : [...prev.roleIds, id],
    }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await onSubmit({
        ...values,
        password: values.password || undefined,
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
          <DialogTitle>{user ? 'Chỉnh sửa người dùng' : 'Tạo người dùng'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Họ tên *</Label>
              <Input
                id="fullName"
                value={values.fullName}
                onChange={(e) => setValues({ ...values, fullName: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={values.email}
                onChange={(e) => setValues({ ...values, email: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="username">Tên đăng nhập *</Label>
              <Input
                id="username"
                value={values.username}
                onChange={(e) => setValues({ ...values, username: e.target.value })}
                required
                minLength={3}
                pattern="[a-zA-Z0-9_.\-]+"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">
                Mật khẩu {user ? '(để trống nếu không đổi)' : '*'}
              </Label>
              <Input
                id="password"
                type="password"
                value={values.password}
                onChange={(e) => setValues({ ...values, password: e.target.value })}
                required={!user}
                minLength={user ? undefined : 6}
              />
            </div>
          </div>

          <div>
            <Label className="mb-2 block">Vai trò</Label>
            <div className="border rounded-md p-3 grid grid-cols-2 gap-2">
              {roles.map((r) => (
                <label key={r.id} className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox
                    checked={values.roleIds.includes(r.id)}
                    onChange={() => toggleRole(r.id)}
                  />
                  <span>{r.name}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="isActive"
              checked={values.isActive}
              onChange={(e) => setValues({ ...values, isActive: e.target.checked })}
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
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Hủy
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Spinner />}
              {user ? 'Cập nhật' : 'Tạo mới'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
