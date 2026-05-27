'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/common/spinner';
import { ApiError } from '@/lib/api/client';
import type { Permission, User } from '@/lib/types';

type Effect = 'allow' | 'deny' | 'inherit';

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  user: User;
  groupedPermissions: Record<string, Permission[]>;
  onSubmit: (
    grants: Array<{ permissionId: string; effect: 'allow' | 'deny' }>,
  ) => Promise<void>;
}

export function UserPermissionsDialog({
  open,
  onOpenChange,
  user,
  groupedPermissions,
  onSubmit,
}: Props) {
  const [effects, setEffects] = useState<Record<string, Effect>>({});
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setError(null);
      const initial: Record<string, Effect> = {};
      user.userPermissions?.forEach((up) => {
        initial[up.permission.id] = up.effect;
      });
      setEffects(initial);
    }
  }, [open, user]);

  const setEffect = (id: string, effect: Effect) => {
    setEffects((prev) => {
      if (effect === 'inherit') {
        const { [id]: _ignored, ...rest } = prev;
        return rest;
      }
      return { ...prev, [id]: effect };
    });
  };

  const handleSubmit = async () => {
    setError(null);
    setLoading(true);
    try {
      const grants = Object.entries(effects)
        .filter(([, e]) => e === 'allow' || e === 'deny')
        .map(([permissionId, effect]) => ({
          permissionId,
          effect: effect as 'allow' | 'deny',
        }));
      await onSubmit(grants);
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
          <DialogTitle>Cấp quyền trực tiếp - {user.fullName}</DialogTitle>
          <DialogDescription>
            Các quyền cấp trực tiếp sẽ ghi đè lên quyền từ vai trò. Chọn{' '}
            <strong>Allow</strong> để cấp thêm, <strong>Deny</strong> để chặn,{' '}
            <strong>Inherit</strong> để giữ nguyên từ vai trò.
          </DialogDescription>
        </DialogHeader>

        <div className="border rounded-md max-h-96 overflow-y-auto p-3 space-y-3">
          {Object.entries(groupedPermissions).map(([resource, perms]) => (
            <div key={resource}>
              <h4 className="font-medium text-sm mb-1 capitalize">
                {resource.replace(/_/g, ' ')}
              </h4>
              <div className="space-y-1 ml-2">
                {perms.map((p) => {
                  const current: Effect = effects[p.id] ?? 'inherit';
                  return (
                    <div key={p.id} className="flex items-center justify-between gap-2 text-sm">
                      <span className="font-mono text-xs">{p.name}</span>
                      <div className="flex gap-1">
                        {(['inherit', 'allow', 'deny'] as Effect[]).map((eff) => (
                          <button
                            key={eff}
                            type="button"
                            onClick={() => setEffect(p.id, eff)}
                            className={
                              'px-2 py-0.5 text-xs rounded border ' +
                              (current === eff
                                ? eff === 'allow'
                                  ? 'bg-green-100 border-green-300 text-green-900'
                                  : eff === 'deny'
                                    ? 'bg-red-100 border-red-300 text-red-900'
                                    : 'bg-muted border-border'
                                : 'bg-background border-border text-muted-foreground hover:bg-accent')
                            }
                          >
                            {eff === 'inherit' ? 'Inherit' : eff === 'allow' ? 'Allow' : 'Deny'}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
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
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading && <Spinner />}
            Lưu
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
