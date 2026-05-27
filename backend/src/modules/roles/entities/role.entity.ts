import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { RolePermission } from './role-permission.entity';
import { UserRole } from '../../users/entities/user-role.entity';

@Entity('roles')
export class Role extends BaseEntity {
  @Column({ length: 50, unique: true })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @Column({ name: 'is_system', type: 'boolean', default: false })
  isSystem!: boolean;

  @OneToMany(() => RolePermission, (rp) => rp.role, { cascade: true })
  rolePermissions!: RolePermission[];

  @OneToMany(() => UserRole, (ur) => ur.role)
  userRoles!: UserRole[];
}
