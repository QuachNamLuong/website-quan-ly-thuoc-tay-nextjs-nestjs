import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { MedicineImportsService } from './medicine-imports.service';
import {
  CreateMedicineImportDto,
  UpdateMedicineImportDto,
} from './dto/medicine-import.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { PERMISSIONS } from '../../common/constants/permissions.constant';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import {
  CurrentUser,
  AuthenticatedUser,
} from '../../common/decorators/current-user.decorator';

@Controller('medicine-imports')
@UseGuards(PermissionsGuard)
export class MedicineImportsController {
  constructor(private readonly importsService: MedicineImportsService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.MEDICINE_IMPORT_READ)
  findAll(@Query() query: PaginationDto) {
    return this.importsService.paginate(query);
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.MEDICINE_IMPORT_READ)
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.importsService.findOne(id);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.MEDICINE_IMPORT_CREATE)
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateMedicineImportDto,
  ) {
    return this.importsService.create(user.id, dto);
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.MEDICINE_IMPORT_UPDATE)
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateMedicineImportDto,
  ) {
    return this.importsService.update(id, dto);
  }

  @Post(':id/complete')
  @RequirePermissions(PERMISSIONS.MEDICINE_IMPORT_COMPLETE)
  complete(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.importsService.complete(id);
  }

  @Post(':id/cancel')
  @RequirePermissions(PERMISSIONS.MEDICINE_IMPORT_UPDATE)
  cancel(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.importsService.cancel(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions(PERMISSIONS.MEDICINE_IMPORT_DELETE)
  remove(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.importsService.remove(id);
  }
}
