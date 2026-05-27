import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { MedicineCategory } from './medicine-category.entity';
import { MedicineImportItem } from '../../medicine-imports/entities/medicine-import-item.entity';

export enum MedicineUnit {
  TABLET = 'tablet',
  BOTTLE = 'bottle',
  BOX = 'box',
  TUBE = 'tube',
  AMPOULE = 'ampoule',
  VIAL = 'vial',
  PACK = 'pack',
}

@Entity('medicines')
export class Medicine extends BaseEntity {
  @Index({ unique: true })
  @Column({ length: 50 })
  code!: string;

  @Column({ length: 200 })
  name!: string;

  @Column({ name: 'generic_name', length: 200, nullable: true, type: "varchar" })
  genericName?: string | null;

  @Column({ length: 200, nullable: true, type: "varchar"  })
  manufacturer?: string | null;

  @Column({
    type: 'enum',
    enum: MedicineUnit,
    default: MedicineUnit.TABLET,
  })
  unit!: MedicineUnit;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  price!: number;

  @Column({ name: 'stock_quantity', type: 'integer', default: 0 })
  stockQuantity!: number;

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ name: 'category_id', type: 'uuid', nullable: true })
  categoryId?: string | null;

  @ManyToOne(() => MedicineCategory, (c) => c.medicines, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'category_id' })
  category?: MedicineCategory | null;

  @OneToMany(() => MedicineImportItem, (mii) => mii.medicine)
  importItems!: MedicineImportItem[];
}
