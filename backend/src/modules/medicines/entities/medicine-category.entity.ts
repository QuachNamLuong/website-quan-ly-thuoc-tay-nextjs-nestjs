import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Medicine } from './medicine.entity';

@Entity('medicine_categories')
export class MedicineCategory extends BaseEntity {
  @Column({ length: 100, unique: true })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @OneToMany(() => Medicine, (m) => m.category)
  medicines!: Medicine[];
}
