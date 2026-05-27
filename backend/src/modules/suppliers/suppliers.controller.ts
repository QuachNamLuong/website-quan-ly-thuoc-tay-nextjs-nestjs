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
import { SuppliersService } from './suppliers.service';
import { CreateSupplierDto, UpdateSupplierDto } from './dto/supplier.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { PERMISSIONS } from '../../common/constants/permissions.constant';
import { PermissionsGuard } from '../auth/guards/permissions.guard';

@Controller('suppliers')
@UseGuards(PermissionsGuard)
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.SUPPLIER_READ)
  findAll(@Query() query: PaginationDto) {
    return this.suppliersService.paginate(query);
  }

  @Get('all')
  @RequirePermissions(PERMISSIONS.SUPPLIER_READ)
  findAllList() {
    return this.suppliersService.findAll();
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.SUPPLIER_READ)
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.suppliersService.findOne(id);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.SUPPLIER_CREATE)
  create(@Body() dto: CreateSupplierDto) {
    return this.suppliersService.create(dto);
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.SUPPLIER_UPDATE)
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateSupplierDto,
  ) {
    return this.suppliersService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions(PERMISSIONS.SUPPLIER_DELETE)
  remove(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.suppliersService.remove(id);
  }
}
