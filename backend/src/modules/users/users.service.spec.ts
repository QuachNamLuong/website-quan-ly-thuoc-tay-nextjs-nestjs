import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { UserRole } from './entities/user-role.entity';
import {
  UserPermission,
  UserPermissionEffect,
} from './entities/user-permission.entity';
import { Role } from '../roles/entities/role.entity';
import { Permission } from '../permissions/entities/permission.entity';

const repoMock = () =>
  ({
    findOne: jest.fn(),
    find: jest.fn(),
    save: jest.fn(),
    create: jest.fn((d) => d),
    softRemove: jest.fn(),
    update: jest.fn(),
    createQueryBuilder: jest.fn(),
  }) as any;

describe('UsersService', () => {
  let service: UsersService;
  let userRepo: any;
  let userPermissionRepo: any;
  let permissionRepo: any;

  beforeEach(async () => {
    userRepo = repoMock();
    userPermissionRepo = repoMock();
    permissionRepo = repoMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: userRepo },
        { provide: getRepositoryToken(UserRole), useValue: repoMock() },
        {
          provide: getRepositoryToken(UserPermission),
          useValue: userPermissionRepo,
        },
        { provide: getRepositoryToken(Role), useValue: repoMock() },
        {
          provide: getRepositoryToken(Permission),
          useValue: permissionRepo,
        },
        {
          provide: DataSource,
          useValue: { transaction: jest.fn() },
        },
      ],
    }).compile();

    service = module.get(UsersService);
  });

  describe('resolveEffectivePermissions', () => {
    it('combines role permissions with direct allow grants and removes denies', async () => {
      const rolePermissions = [
        { name: 'medicine:read' },
        { name: 'medicine:create' },
      ] as Permission[];

      const directGrants = [
        {
          effect: UserPermissionEffect.ALLOW,
          permission: { name: 'user:read' },
        },
        {
          effect: UserPermissionEffect.DENY,
          permission: { name: 'medicine:create' },
        },
      ] as UserPermission[];

      // permissionRepository.createQueryBuilder chain
      const qb = {
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(rolePermissions),
      };
      permissionRepo.createQueryBuilder.mockReturnValue(qb);
      userPermissionRepo.find.mockResolvedValue(directGrants);

      const result = await service.resolveEffectivePermissions('user-id');

      expect(result).toContain('medicine:read');
      expect(result).toContain('user:read');
      expect(result).not.toContain('medicine:create'); // denied
    });

    it('returns empty array when user has no roles and no grants', async () => {
      const qb = {
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };
      permissionRepo.createQueryBuilder.mockReturnValue(qb);
      userPermissionRepo.find.mockResolvedValue([]);

      const result = await service.resolveEffectivePermissions('u');
      expect(result).toEqual([]);
    });

    it('deduplicates permissions when granted by both role and direct allow', async () => {
      const qb = {
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([{ name: 'medicine:read' }]),
      };
      permissionRepo.createQueryBuilder.mockReturnValue(qb);
      userPermissionRepo.find.mockResolvedValue([
        {
          effect: UserPermissionEffect.ALLOW,
          permission: { name: 'medicine:read' },
        },
      ]);

      const result = await service.resolveEffectivePermissions('u');
      expect(result.filter((p) => p === 'medicine:read')).toHaveLength(1);
    });
  });
});
