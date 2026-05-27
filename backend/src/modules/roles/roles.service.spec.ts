import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { RolesService } from './roles.service';
import { Role } from './entities/role.entity';
import { RolePermission } from './entities/role-permission.entity';
import { Permission } from '../permissions/entities/permission.entity';

const repoMock = () =>
  ({
    findOne: jest.fn(),
    find: jest.fn(),
    save: jest.fn(),
    create: jest.fn((d) => d),
    softRemove: jest.fn(),
    delete: jest.fn(),
  }) as any;

describe('RolesService', () => {
  let service: RolesService;
  let roleRepo: any;

  beforeEach(async () => {
    roleRepo = repoMock();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesService,
        { provide: getRepositoryToken(Role), useValue: roleRepo },
        {
          provide: getRepositoryToken(RolePermission),
          useValue: repoMock(),
        },
        { provide: getRepositoryToken(Permission), useValue: repoMock() },
        { provide: DataSource, useValue: { transaction: jest.fn() } },
      ],
    }).compile();

    service = module.get(RolesService);
  });

  it('throws NotFoundException when role does not exist', async () => {
    roleRepo.findOne.mockResolvedValue(null);
    await expect(service.findOne('id')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('blocks deleting a system role', async () => {
    roleRepo.findOne.mockResolvedValue({
      id: 'r',
      name: 'super_admin',
      isSystem: true,
    } as Role);
    await expect(service.remove('r')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('blocks updating a system role', async () => {
    roleRepo.findOne.mockResolvedValue({
      id: 'r',
      name: 'super_admin',
      isSystem: true,
    } as Role);
    await expect(
      service.update('r', { name: 'new' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('blocks creating role with duplicate name', async () => {
    roleRepo.findOne.mockResolvedValue({ id: 'x' } as Role);
    await expect(
      service.create({ name: 'admin' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
