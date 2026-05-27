import { Entity, Column, OneToMany, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { UserRole } from './user-role.entity';
import { UserPermission } from './user-permission.entity';

@Entity('users')
export class User extends BaseEntity {
  @Index({ unique: true })
  @Column({ length: 100 })
  email!: string;

  @Index({ unique: true })
  @Column({ length: 50 })
  username!: string;

  @Column({ name: 'password_hash', length: 255, select: false })
  passwordHash!: string;

  @Column({ name: 'full_name', length: 100 })
  fullName!: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ name: 'last_login_at', type: 'timestamptz', nullable: true })
  lastLoginAt?: Date | null;

  @OneToMany(() => UserRole, (ur) => ur.user, { cascade: true })
  userRoles!: UserRole[];

  @OneToMany(() => UserPermission, (up) => up.user, { cascade: true })
  userPermissions!: UserPermission[];
}
