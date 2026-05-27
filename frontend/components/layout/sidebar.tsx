'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/hooks/use-auth';
import { PERMISSIONS, type PermissionKey } from '@/lib/types';
import { cn } from '@/lib/utils';

interface NavItem {
  href: string;
  label: string;
  permissions: PermissionKey[];
}

const NAV_ITEMS: NavItem[] = [
  {
    href: '/dashboard',
    label: 'Tổng quan',
    permissions: [],
  },
  {
    href: '/dashboard/medicines',
    label: 'Thuốc',
    permissions: [PERMISSIONS.MEDICINE_READ],
  },
  {
    href: '/dashboard/medicine-imports',
    label: 'Phiếu nhập',
    permissions: [PERMISSIONS.MEDICINE_IMPORT_READ],
  },
  {
    href: '/dashboard/suppliers',
    label: 'Nhà cung cấp',
    permissions: [PERMISSIONS.SUPPLIER_READ],
  },
  {
    href: '/dashboard/users',
    label: 'Người dùng',
    permissions: [PERMISSIONS.USER_READ],
  },
  {
    href: '/dashboard/roles',
    label: 'Vai trò',
    permissions: [PERMISSIONS.ROLE_READ],
  },
  {
    href: '/dashboard/permissions',
    label: 'Quyền',
    permissions: [PERMISSIONS.PERMISSION_READ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { hasAnyPermission } = useAuth();

  const visible = NAV_ITEMS.filter(
    (i) => i.permissions.length === 0 || hasAnyPermission(...i.permissions),
  );

  return (
    <aside className="w-60 border-r bg-card hidden md:flex flex-col">
      <div className="h-14 flex items-center px-4 border-b">
        <h1 className="font-semibold">Quản lý Nhà thuốc</h1>
      </div>
      <nav className="flex-1 p-2 space-y-1">
        {visible.map((item) => {
          const active =
            item.href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'block rounded-md px-3 py-2 text-sm font-medium transition-colors',
                active
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground',
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
