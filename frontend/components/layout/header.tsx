'use client';

import { useAuth } from '@/lib/hooks/use-auth';
import { Button } from '@/components/ui/button';

export function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="h-14 border-b bg-card flex items-center justify-between px-4">
      <div />
      <div className="flex items-center gap-3">
        {user && (
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium">{user.fullName}</p>
            <p className="text-xs text-muted-foreground">
              {user.roles.join(', ') || 'Người dùng'}
            </p>
          </div>
        )}
        <Button variant="outline" size="sm" onClick={logout}>
          Đăng xuất
        </Button>
      </div>
    </header>
  );
}
