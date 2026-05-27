'use client';

import type { ReactNode } from 'react';
import { useAuth } from '@/lib/hooks/use-auth';
import type { PermissionKey } from '@/lib/types';

interface PermissionGateProps {
  permission?: PermissionKey;
  anyOf?: PermissionKey[];
  fallback?: ReactNode;
  children: ReactNode;
}

/**
 * Renders children only when the current user has the required permission(s).
 * Use `permission` for a single requirement, `anyOf` to accept any of several.
 */
export function PermissionGate({
  permission,
  anyOf,
  fallback = null,
  children,
}: PermissionGateProps) {
  const { hasPermission, hasAnyPermission } = useAuth();

  if (permission && !hasPermission(permission)) return <>{fallback}</>;
  if (anyOf && !hasAnyPermission(...anyOf)) return <>{fallback}</>;

  return <>{children}</>;
}
