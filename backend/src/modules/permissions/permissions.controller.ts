import { Controller, Get, UseGuards } from '@nestjs/common';
import { PermissionsService } from './permissions.service';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { PERMISSIONS } from '../../common/constants/permissions.constant';

@Controller('permissions')
@UseGuards(PermissionsGuard)
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.PERMISSION_READ)
  findAll() {
    return this.permissionsService.findAll();
  }

  @Get('grouped')
  @RequirePermissions(PERMISSIONS.PERMISSION_READ)
  findGrouped() {
    return this.permissionsService.findGroupedByResource();
  }
}
