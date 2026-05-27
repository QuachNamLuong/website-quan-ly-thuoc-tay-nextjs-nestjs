import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { MedicineImport } from './medicine-import.entity';
import { Medicine } from '../../medicines/entities/medicine.entity';

@Entity('medicine_import_items')
@Index(['importId', 'medicineId', 'batchNumber'], { unique: true })
export class MedicineImportItem {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'import_id', type: 'uuid' })
  importId!: string;

  @Column({ name: 'medicine_id', type: 'uuid' })
  medicineId!: string;

  @Column({ name: 'batch_number', length: 100 })
  batchNumber!: string;

  @Column({ name: 'expiry_date', type: 'date' })
  expiryDate!: Date;

  @Column({ type: 'integer' })
  quantity!: number;

  @Column({
    name: 'unit_price',
    type: 'decimal',
    precision: 12,
    scale: 2,
  })
  unitPrice!: number;

  @Column({
    name: 'subtotal',
    type: 'decimal',
    precision: 14,
    scale: 2,
  })
  subtotal!: number;

  @ManyToOne(() => MedicineImport, (mi) => mi.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'import_id' })
  import!: MedicineImport;

  @ManyToOne(() => Medicine, (m) => m.importItems, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'medicine_id' })
  medicine!: Medicine;
}
