import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
  CreateDateColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Permission } from '../../permissions/entities/permission.entity';

export enum UserPermissionEffect {
  ALLOW = 'allow',
  DENY = 'deny',
}

/**
 * Direct user permissions - allows granting or denying specific permissions
 * to individual users, overriding their role-based permissions.
 * "deny" takes precedence over "allow".
 */
@Entity('user_permissions')
@Index(['userId', 'permissionId'], { unique: true })
export class UserPermission {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ name: 'permission_id', type: 'uuid' })
  permissionId!: string;

  @Column({
    type: 'enum',
    enum: UserPermissionEffect,
    default: UserPermissionEffect.ALLOW,
  })
  effect!: UserPermissionEffect;

  @Column({ name: 'granted_by', type: 'uuid', nullable: true })
  grantedBy?: string | null;

  @CreateDateColumn({ name: 'granted_at', type: 'timestamptz' })
  grantedAt!: Date;

  @ManyToOne(() => User, (user) => user.userPermissions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @ManyToOne(() => Permission, (permission) => permission.userPermissions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'permission_id' })
  permission!: Permission;
}
