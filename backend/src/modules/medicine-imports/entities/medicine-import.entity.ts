import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Supplier } from '../../suppliers/entities/supplier.entity';
import { User } from '../../users/entities/user.entity';
import { MedicineImportItem } from './medicine-import-item.entity';

export enum ImportStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

@Entity('medicine_imports')
export class MedicineImport extends BaseEntity {
  @Index({ unique: true })
  @Column({ name: 'import_code', length: 50 })
  importCode!: string;

  @Column({ name: 'supplier_id', type: 'uuid' })
  supplierId!: string;

  @Column({ name: 'imported_by', type: 'uuid' })
  importedBy!: string;

  @Column({ name: 'import_date', type: 'timestamptz' })
  importDate!: Date;

  @Column({
    type: 'enum',
    enum: ImportStatus,
    default: ImportStatus.PENDING,
  })
  status!: ImportStatus;

  @Column({
    name: 'total_amount',
    type: 'decimal',
    precision: 14,
    scale: 2,
    default: 0,
  })
  totalAmount!: number;

  @Column({ type: 'text', nullable: true })
  notes?: string | null;

  @ManyToOne(() => Supplier, (s) => s.imports, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'supplier_id' })
  supplier!: Supplier;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'imported_by' })
  importer!: User;

  @OneToMany(() => MedicineImportItem, (mii) => mii.import, { cascade: true })
  items!: MedicineImportItem[];
}
