import { IsString } from 'class-validator';

export class CreateMedicineDto {
  @IsString({ message: '' })
  name!: string;
}
