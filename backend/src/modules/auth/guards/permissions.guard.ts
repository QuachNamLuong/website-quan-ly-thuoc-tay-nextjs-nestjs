import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { PERMISSIONS_KEY } from '../../../common/decorators/permissions.decorator';
import { PermissionKey } from '../../../common/constants/permissions.constant';
import { AuthenticatedUser } from '../../../common/decorators/current-user.decorator';

interface RequestWithUser extends Request {
  user?: AuthenticatedUser;
}

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<PermissionKey[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!required || required.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Bạn cần đăng nhập để thực hiện thao tác này');
    }

    const userPermissions = new Set(user.permissions);
    const missing = required.filter((p) => !userPermissions.has(p));

    if (missing.length > 0) {
      throw new ForbiddenException(
        `Bạn không có quyền: ${missing.join(', ')}`,
      );
    }

    return true;
  }
}
