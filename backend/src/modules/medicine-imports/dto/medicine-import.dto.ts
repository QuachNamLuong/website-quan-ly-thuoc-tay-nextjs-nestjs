import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateMedicineImportItemDto {
  @IsUUID('4')
  medicineId!: string;

  @IsString()
  @IsNotEmpty({ message: 'Số lô không được để trống' })
  @MaxLength(100)
  batchNumber!: string;

  @IsDateString({}, { message: 'Hạn sử dụng không hợp lệ' })
  expiryDate!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1, { message: 'Số lượng phải >= 1' })
  quantity!: number;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  unitPrice!: number;
}

export class CreateMedicineImportDto {
  @IsUUID('4')
  supplierId!: string;

  @IsDateString({}, { message: 'Ngày nhập không hợp lệ' })
  importDate!: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsArray()
  @ArrayMinSize(1, { message: 'Cần có ít nhất một mặt hàng' })
  @ValidateNested({ each: true })
  @Type(() => CreateMedicineImportItemDto)
  items!: CreateMedicineImportItemDto[];
}

export class UpdateMedicineImportDto {
  @IsOptional()
  @IsUUID('4')
  supplierId?: string;

  @IsOptional()
  @IsDateString()
  importDate?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateMedicineImportItemDto)
  items?: CreateMedicineImportItemDto[];
}
