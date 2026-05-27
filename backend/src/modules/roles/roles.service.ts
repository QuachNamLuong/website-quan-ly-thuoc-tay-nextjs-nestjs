import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { Role } from './entities/role.entity';
import { RolePermission } from './entities/role-permission.entity';
import { Permission } from '../permissions/entities/permission.entity';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(RolePermission)
    private readonly rolePermissionRepository: Repository<RolePermission>,
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
    private readonly dataSource: DataSource,
  ) {}

  async findAll(): Promise<Role[]> {
    return this.roleRepository.find({
      relations: { rolePermissions: { permission: true } },
      order: { name: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Role> {
    const role = await this.roleRepository.findOne({
      where: { id },
      relations: { rolePermissions: { permission: true } },
    });
    if (!role) {
      throw new NotFoundException('Không tìm thấy vai trò');
    }
    return role;
  }

  async findByName(name: string): Promise<Role | null> {
    return this.roleRepository.findOne({ where: { name } });
  }

  async create(dto: CreateRoleDto): Promise<Role> {
    if (await this.findByName(dto.name)) {
      throw new ConflictException('Tên vai trò đã tồn tại');
    }

    return this.dataSource.transaction(async (manager) => {
      const role = manager.getRepository(Role).create({
        name: dto.name,
        description: dto.description,
        isSystem: false,
      });
      const saved = await manager.getRepository(Role).save(role);

      if (dto.permissionIds && dto.permissionIds.length > 0) {
        await this.setRolePermissionsInternal(
          manager,
          saved.id,
          dto.permissionIds,
        );
      }

      return this.findOneWithManager(manager, saved.id);
    });
  }

  async update(id: string, dto: UpdateRoleDto): Promise<Role> {
    const role = await this.findOne(id);
    if (role.isSystem) {
      throw new BadRequestException(
        'Không thể chỉnh sửa vai trò hệ thống',
      );
    }

    if (dto.name && dto.name !== role.name) {
      if (await this.findByName(dto.name)) {
        throw new ConflictException('Tên vai trò đã tồn tại');
      }
    }

    return this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(Role);
      if (dto.name !== undefined) role.name = dto.name;
      if (dto.description !== undefined) role.description = dto.description;
      await repo.save(role);

      if (dto.permissionIds) {
        await manager
          .getRepository(RolePermission)
          .delete({ roleId: id });
        await this.setRolePermissionsInternal(manager, id, dto.permissionIds);
      }

      return this.findOneWithManager(manager, id);
    });
  }

  async remove(id: string): Promise<void> {
    const role = await this.findOne(id);
    if (role.isSystem) {
      throw new BadRequestException('Không thể xóa vai trò hệ thống');
    }
    await this.roleRepository.softRemove(role);
  }

  private async setRolePermissionsInternal(
    manager: DataSource['manager'],
    roleId: string,
    permissionIds: string[],
  ): Promise<void> {
    if (permissionIds.length === 0) return;
    const permissions = await manager
      .getRepository(Permission)
      .find({ where: { id: In(permissionIds) } });
    if (permissions.length !== new Set(permissionIds).size) {
      throw new BadRequestException('Một số quyền không tồn tại');
    }
    const entities = permissionIds.map((permissionId) =>
      manager.getRepository(RolePermission).create({ roleId, permissionId }),
    );
    await manager.getRepository(RolePermission).save(entities);
  }

  private async findOneWithManager(
    manager: DataSource['manager'],
    id: string,
  ): Promise<Role> {
    const role = await manager.getRepository(Role).findOne({
      where: { id },
      relations: { rolePermissions: { permission: true } },
    });
    if (!role) {
      throw new NotFoundException('Không tìm thấy vai trò');
    }
    return role;
  }
}
