import { SetMetadata } from '@nestjs/common';
import { PermissionKey } from '../constants/permissions.constant';

export const PERMISSIONS_KEY = 'required_permissions';

/**
 * Decorator that attaches required permissions to a route handler.
 * The PermissionsGuard will check that the user has ALL listed permissions.
 *
 * @example
 *   @RequirePermissions(PERMISSIONS.MEDICINE_CREATE)
 *   create() {...}
 */
export const RequirePermissions = (...permissions: PermissionKey[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
