import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../../modules/users/entities/user.entity';
import { UserRole } from '../../modules/users/entities/user-role.entity';
import { Role } from '../../modules/roles/entities/role.entity';
import { RolePermission } from '../../modules/roles/entities/role-permission.entity';
import { Permission } from '../../modules/permissions/entities/permission.entity';
import {
  ALL_PERMISSIONS,
  PERMISSIONS,
  PermissionKey,
  SYSTEM_ROLES,
} from '../../common/constants/permissions.constant';

@Injectable()
export class DatabaseSeeder implements OnModuleInit {
  private readonly logger = new Logger(DatabaseSeeder.name);

  constructor(
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(RolePermission)
    private readonly rolePermissionRepository: Repository<RolePermission>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserRole)
    private readonly userRoleRepository: Repository<UserRole>,
    private readonly configService: ConfigService,
    private readonly dataSource: DataSource,
  ) {}

  async onModuleInit(): Promise<void> {
    if (this.configService.get<string>('SKIP_SEED') === 'true') {
      this.logger.log('Skipping database seeding (SKIP_SEED=true)');
      return;
    }
    try {
      await this.seed();
    } catch (err) {
      this.logger.error('Failed to seed database', err as Error);
    }
  }

  async seed(): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      await this.seedPermissions(manager);
      await this.seedRoles(manager);
      await this.seedSuperAdmin(manager);
    });
    this.logger.log('Database seeding completed');
  }

  private async seedPermissions(manager: DataSource['manager']): Promise<void> {
    const repo = manager.getRepository(Permission);
    for (const name of ALL_PERMISSIONS) {
      const [resource, action] = name.split(':');
      const existing = await repo.findOne({ where: { name } });
      if (!existing) {
        await repo.save(
          repo.create({
            name,
            resource,
            action,
            description: `Permission to ${action} ${resource}`,
          }),
        );
      }
    }
  }

  private async seedRoles(manager: DataSource['manager']): Promise<void> {
    const roleRepo = manager.getRepository(Role);
    const rolePermissionRepo = manager.getRepository(RolePermission);
    const permissionRepo = manager.getRepository(Permission);

    const allPermissions = await permissionRepo.find();
    const byName = new Map(allPermissions.map((p) => [p.name, p]));

    const definitions: Array<{
      name: string;
      description: string;
      permissions: PermissionKey[];
    }> = [
      {
        name: SYSTEM_ROLES.SUPER_ADMIN,
        description: 'Toàn quyền hệ thống',
        permissions: [...ALL_PERMISSIONS],
      },
      {
        name: SYSTEM_ROLES.ADMIN,
        description: 'Quản trị (không quản lý quyền hệ thống)',
        permissions: ALL_PERMISSIONS.filter(
          (p) =>
            p !== PERMISSIONS.USER_GRANT_PERMISSION &&
            p !== PERMISSIONS.PERMISSION_READ,
        ),
      },
      {
        name: SYSTEM_ROLES.PHARMACIST,
        description: 'Dược sĩ - quản lý thuốc và nhập thuốc',
        permissions: [
          PERMISSIONS.MEDICINE_CREATE,
          PERMISSIONS.MEDICINE_READ,
          PERMISSIONS.MEDICINE_UPDATE,
          PERMISSIONS.MEDICINE_DELETE,
          PERMISSIONS.MEDICINE_CATEGORY_READ,
          PERMISSIONS.MEDICINE_CATEGORY_CREATE,
          PERMISSIONS.MEDICINE_CATEGORY_UPDATE,
          PERMISSIONS.MEDICINE_IMPORT_CREATE,
          PERMISSIONS.MEDICINE_IMPORT_READ,
          PERMISSIONS.MEDICINE_IMPORT_UPDATE,
          PERMISSIONS.MEDICINE_IMPORT_COMPLETE,
          PERMISSIONS.SUPPLIER_READ,
          PERMISSIONS.SUPPLIER_CREATE,
          PERMISSIONS.SUPPLIER_UPDATE,
        ],
      },
      {
        name: SYSTEM_ROLES.STAFF,
        description: 'Nhân viên - chỉ đọc',
        permissions: [
          PERMISSIONS.MEDICINE_READ,
          PERMISSIONS.MEDICINE_CATEGORY_READ,
          PERMISSIONS.MEDICINE_IMPORT_READ,
          PERMISSIONS.SUPPLIER_READ,
        ],
      },
    ];

    for (const def of definitions) {
      let role = await roleRepo.findOne({ where: { name: def.name } });
      if (!role) {
        role = await roleRepo.save(
          roleRepo.create({
            name: def.name,
            description: def.description,
            isSystem: true,
          }),
        );
      }
      // Sync permissions for system roles
      await rolePermissionRepo.delete({ roleId: role.id });
      const grants = def.permissions
        .map((pn) => byName.get(pn))
        .filter((p): p is Permission => !!p)
        .map((p) =>
          rolePermissionRepo.create({
            roleId: role!.id,
            permissionId: p.id,
          }),
        );
      if (grants.length > 0) {
        await rolePermissionRepo.save(grants);
      }
    }
  }

  private async seedSuperAdmin(manager: DataSource['manager']): Promise<void> {
    const email =
      this.configService.get<string>('SUPER_ADMIN_EMAIL') ?? 'admin@example.com';
    const username =
      this.configService.get<string>('SUPER_ADMIN_USERNAME') ?? 'admin';
    const password =
      this.configService.get<string>('SUPER_ADMIN_PASSWORD') ?? 'Admin@123';

    const userRepo = manager.getRepository(User);
    const userRoleRepo = manager.getRepository(UserRole);
    const roleRepo = manager.getRepository(Role);

    let user = await userRepo.findOne({ where: { email } });
    if (!user) {
      const passwordHash = await bcrypt.hash(password, 10);
      user = await userRepo.save(
        userRepo.create({
          email,
          username,
          passwordHash,
          fullName: 'Super Admin',
          isActive: true,
        }),
      );
      this.logger.log(`Super admin created: ${email} / ${password}`);
    }

    const superRole = await roleRepo.findOne({
      where: { name: SYSTEM_ROLES.SUPER_ADMIN },
    });
    if (superRole) {
      const existing = await userRoleRepo.findOne({
        where: { userId: user.id, roleId: superRole.id },
      });
      if (!existing) {
        await userRoleRepo.save(
          userRoleRepo.create({ userId: user.id, roleId: superRole.id }),
        );
      }
    }
  }
}
