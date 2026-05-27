import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MedicineImport } from './entities/medicine-import.entity';
import { MedicineImportItem } from './entities/medicine-import-item.entity';
import { Medicine } from '../medicines/entities/medicine.entity';
import { Supplier } from '../suppliers/entities/supplier.entity';
import { MedicineImportsService } from './medicine-imports.service';
import { MedicineImportsController } from './medicine-imports.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      MedicineImport,
      MedicineImportItem,
      Medicine,
      Supplier,
    ]),
  ],
  providers: [MedicineImportsService],
  controllers: [MedicineImportsController],
  exports: [MedicineImportsService],
})
export class MedicineImportsModule {}
