import { Entity, Column, Index, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { RolePermission } from '../../roles/entities/role-permission.entity';
import { UserPermission } from '../../users/entities/user-permission.entity';

/**
 * Permission entity (4NF compliant)
 * - Each permission represents a single atomic action on a resource
 * - Format: "resource:action" (e.g. "medicine:create", "user:read")
 */
@Entity('permissions')
@Index(['resource', 'action'], { unique: true })
export class Permission extends BaseEntity {
  @Column({ length: 100, unique: true })
  name!: string;

  @Column({ length: 50 })
  resource!: string;

  @Column({ length: 50 })
  action!: string;

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @OneToMany(() => RolePermission, (rp) => rp.permission)
  rolePermissions!: RolePermission[];

  @OneToMany(() => UserPermission, (up) => up.permission)
  userPermissions!: UserPermission[];
}
