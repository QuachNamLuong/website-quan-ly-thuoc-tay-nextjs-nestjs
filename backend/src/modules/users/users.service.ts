import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { UserRole } from './entities/user-role.entity';
import {
  UserPermission,
  UserPermissionEffect,
} from './entities/user-permission.entity';
import { Role } from '../roles/entities/role.entity';
import { Permission } from '../permissions/entities/permission.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AssignRolesDto } from './dto/assign-roles.dto';
import { GrantPermissionsDto } from './dto/grant-permissions.dto';
import {
  PaginatedResult,
  PaginationDto,
} from '../../common/dto/pagination.dto';

interface CreateUserInternal {
  email: string;
  username: string;
  passwordHash: string;
  fullName: string;
  roleIds?: string[];
  isActive?: boolean;
}

@Injectable()
export class UsersService {
  private static readonly SALT_ROUNDS = 10;

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserRole)
    private readonly userRoleRepository: Repository<UserRole>,
    @InjectRepository(UserPermission)
    private readonly userPermissionRepository: Repository<UserPermission>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
    private readonly dataSource: DataSource,
  ) {}

  // ----- Queries -----

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { username } });
  }

  async findByEmailWithPassword(email: string): Promise<User | null> {
    return this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('user.email = :email', { email })
      .getOne();
  }

  async findByIdWithPermissions(id: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { id },
      relations: {
        userRoles: { role: true },
      },
    });
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: {
        userRoles: { role: true },
        userPermissions: { permission: true },
      },
    });
    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }
    return user;
  }

  async paginate(dto: PaginationDto): Promise<PaginatedResult<User>> {
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 20;
    const qb = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.userRoles', 'ur')
      .leftJoinAndSelect('ur.role', 'role')
      .orderBy('user.createdAt', 'DESC');

    if (dto.search) {
      qb.where(
        'user.email ILIKE :s OR user.username ILIKE :s OR user.fullName ILIKE :s',
        { s: `%${dto.search}%` },
      );
    }

    qb.skip((page - 1) * limit).take(limit);

    const [data, total] = await qb.getManyAndCount();
    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }

  // ----- Mutations -----

  async updateLastLogin(userId: string): Promise<void> {
    await this.userRepository.update(userId, { lastLoginAt: new Date() });
  }

  async createUser(input: CreateUserInternal): Promise<User> {
    return this.dataSource.transaction(async (manager) => {
      const userRepo = manager.getRepository(User);

      const user = userRepo.create({
        email: input.email,
        username: input.username,
        passwordHash: input.passwordHash,
        fullName: input.fullName,
        isActive: input.isActive ?? true,
      });
      const saved = await userRepo.save(user);

      if (input.roleIds && input.roleIds.length > 0) {
        await this.assignRolesInternal(manager, saved.id, input.roleIds);
      }

      const found = await userRepo.findOne({
        where: { id: saved.id },
        relations: { userRoles: { role: true } },
      });
      if (!found) {
        throw new NotFoundException('Lỗi tạo người dùng');
      }
      return found;
    });
  }

  async create(dto: CreateUserDto): Promise<User> {
    if (await this.findByEmail(dto.email)) {
      throw new ConflictException('Email đã được sử dụng');
    }
    if (await this.findByUsername(dto.username)) {
      throw new ConflictException('Tên đăng nhập đã được sử dụng');
    }
    const passwordHash = await bcrypt.hash(
      dto.password,
      UsersService.SALT_ROUNDS,
    );
    return this.createUser({
      email: dto.email,
      username: dto.username,
      passwordHash,
      fullName: dto.fullName,
      isActive: dto.isActive,
      roleIds: dto.roleIds,
    });
  }

  async update(id: string, dto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);

    if (dto.email && dto.email !== user.email) {
      if (await this.findByEmail(dto.email)) {
        throw new ConflictException('Email đã được sử dụng');
      }
      user.email = dto.email;
    }
    if (dto.username && dto.username !== user.username) {
      if (await this.findByUsername(dto.username)) {
        throw new ConflictException('Tên đăng nhập đã được sử dụng');
      }
      user.username = dto.username;
    }
    if (dto.fullName !== undefined) user.fullName = dto.fullName;
    if (dto.isActive !== undefined) user.isActive = dto.isActive;
    if (dto.password) {
      user.passwordHash = await bcrypt.hash(
        dto.password,
        UsersService.SALT_ROUNDS,
      );
    }

    return this.userRepository.save(user);
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    await this.userRepository.softRemove(user);
  }

  // ----- Role assignment -----

  async assignRoles(userId: string, dto: AssignRolesDto): Promise<User> {
    await this.findOne(userId); // ensure exists

    return this.dataSource.transaction(async (manager) => {
      await manager.getRepository(UserRole).delete({ userId });
      await this.assignRolesInternal(manager, userId, dto.roleIds);
      const reload = await manager.getRepository(User).findOne({
        where: { id: userId },
        relations: { userRoles: { role: true } },
      });
      if (!reload) {
        throw new NotFoundException('Không tìm thấy người dùng');
      }
      return reload;
    });
  }

  private async assignRolesInternal(
    manager: DataSource['manager'],
    userId: string,
    roleIds: string[],
  ): Promise<void> {
    if (roleIds.length === 0) return;
    const roles = await manager
      .getRepository(Role)
      .find({ where: { id: In(roleIds) } });
    if (roles.length !== roleIds.length) {
      throw new BadRequestException('Một số vai trò không tồn tại');
    }
    const entities = roleIds.map((roleId) =>
      manager.getRepository(UserRole).create({ userId, roleId }),
    );
    await manager.getRepository(UserRole).save(entities);
  }

  // ----- Direct permission grants -----

  async grantPermissions(
    userId: string,
    dto: GrantPermissionsDto,
  ): Promise<User> {
    await this.findOne(userId);

    const permissionIds = dto.grants.map((g) => g.permissionId);
    const permissions = await this.permissionRepository.find({
      where: { id: In(permissionIds) },
    });
    if (permissions.length !== new Set(permissionIds).size) {
      throw new BadRequestException('Một số quyền không tồn tại');
    }

    return this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(UserPermission);
      await repo.delete({ userId });
      const entities = dto.grants.map((g) =>
        repo.create({
          userId,
          permissionId: g.permissionId,
          effect: g.effect,
        }),
      );
      if (entities.length > 0) {
        await repo.save(entities);
      }
      const reload = await manager.getRepository(User).findOne({
        where: { id: userId },
        relations: {
          userRoles: { role: true },
          userPermissions: { permission: true },
        },
      });
      if (!reload) {
        throw new NotFoundException('Không tìm thấy người dùng');
      }
      return reload;
    });
  }

  /**
   * Computes the effective set of permissions for a user:
   *   effective = (union of role permissions ∪ direct ALLOW grants) - direct DENY grants
   */
  async resolveEffectivePermissions(userId: string): Promise<string[]> {
    // Permissions from roles
    const rolePerms = await this.permissionRepository
      .createQueryBuilder('p')
      .innerJoin('role_permissions', 'rp', 'rp.permission_id = p.id')
      .innerJoin('user_roles', 'ur', 'ur.role_id = rp.role_id')
      .where('ur.user_id = :userId', { userId })
      .getMany();

    // Direct grants
    const directGrants = await this.userPermissionRepository.find({
      where: { userId },
      relations: { permission: true },
    });

    const allowSet = new Set<string>(rolePerms.map((p) => p.name));
    const denySet = new Set<string>();

    for (const grant of directGrants) {
      if (grant.effect === UserPermissionEffect.ALLOW) {
        allowSet.add(grant.permission.name);
      } else {
        denySet.add(grant.permission.name);
      }
    }

    for (const denied of denySet) {
      allowSet.delete(denied);
    }

    return Array.from(allowSet).sort();
  }
}
