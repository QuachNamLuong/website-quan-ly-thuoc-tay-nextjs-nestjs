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
import { MedicinesService } from './medicines.service';
import { CreateMedicineDto } from './dto/create-medicine.dto';
import { UpdateMedicineDto } from './dto/update-medicine.dto';
import { FindMedicinesDto } from './dto/find-medicines.dto';
import {
  CreateMedicineCategoryDto,
  UpdateMedicineCategoryDto,
} from './dto/medicine-category.dto';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { PERMISSIONS } from '../../common/constants/permissions.constant';
import { PermissionsGuard } from '../auth/guards/permissions.guard';

@Controller('medicines')
@UseGuards(PermissionsGuard)
export class MedicinesController {
  constructor(private readonly medicinesService: MedicinesService) {}

  // ----- Categories (registered before :id to avoid conflict) -----

  @Get('categories')
  @RequirePermissions(PERMISSIONS.MEDICINE_CATEGORY_READ)
  findAllCategories() {
    return this.medicinesService.findAllCategories();
  }

  @Post('categories')
  @RequirePermissions(PERMISSIONS.MEDICINE_CATEGORY_CREATE)
  createCategory(@Body() dto: CreateMedicineCategoryDto) {
    return this.medicinesService.createCategory(dto);
  }

  @Patch('categories/:id')
  @RequirePermissions(PERMISSIONS.MEDICINE_CATEGORY_UPDATE)
  updateCategory(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateMedicineCategoryDto,
  ) {
    return this.medicinesService.updateCategory(id, dto);
  }

  @Delete('categories/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions(PERMISSIONS.MEDICINE_CATEGORY_DELETE)
  removeCategory(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.medicinesService.removeCategory(id);
  }

  // ----- Medicines -----

  @Get()
  @RequirePermissions(PERMISSIONS.MEDICINE_READ)
  findAll(@Query() query: FindMedicinesDto) {
    return this.medicinesService.paginate(query);
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.MEDICINE_READ)
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.medicinesService.findOne(id);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.MEDICINE_CREATE)
  create(@Body() dto: CreateMedicineDto) {
    return this.medicinesService.create(dto);
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.MEDICINE_UPDATE)
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateMedicineDto,
  ) {
    return this.medicinesService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions(PERMISSIONS.MEDICINE_DELETE)
  remove(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.medicinesService.remove(id);
  }
}
