import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { MedicineImport } from '../../medicine-imports/entities/medicine-import.entity';

@Entity('suppliers')
export class Supplier extends BaseEntity {
  @Column({ length: 200 })
  name!: string;

  @Column({ length: 100, nullable: true, type: "varchar" })
  email?: string | null;

  @Column({ length: 20, nullable: true, type: "varchar" })
  phone?: string | null;

  @Column({ type: 'text', nullable: true })
  address?: string | null;

  @Column({ name: 'tax_code', length: 50, nullable: true , type: "varchar"})
  taxCode?: string | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @OneToMany(() => MedicineImport, (mi) => mi.supplier)
  imports!: MedicineImport[];
}
