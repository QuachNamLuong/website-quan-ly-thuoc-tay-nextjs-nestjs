import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { MedicineImportsService } from './medicine-imports.service';
import {
  ImportStatus,
  MedicineImport,
} from './entities/medicine-import.entity';
import { MedicineImportItem } from './entities/medicine-import-item.entity';
import { Medicine } from '../medicines/entities/medicine.entity';
import { Supplier } from '../suppliers/entities/supplier.entity';

const repoMock = () =>
  ({
    findOne: jest.fn(),
    find: jest.fn(),
    save: jest.fn(),
    create: jest.fn((d) => d),
    softRemove: jest.fn(),
    delete: jest.fn(),
    increment: jest.fn(),
    createQueryBuilder: jest.fn(),
  }) as any;

describe('MedicineImportsService', () => {
  let service: MedicineImportsService;
  let importRepo: any;
  let dataSource: any;

  beforeEach(async () => {
    importRepo = repoMock();
    dataSource = { transaction: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MedicineImportsService,
        { provide: getRepositoryToken(MedicineImport), useValue: importRepo },
        {
          provide: getRepositoryToken(MedicineImportItem),
          useValue: repoMock(),
        },
        { provide: getRepositoryToken(Medicine), useValue: repoMock() },
        { provide: getRepositoryToken(Supplier), useValue: repoMock() },
        { provide: DataSource, useValue: dataSource },
      ],
    }).compile();

    service = module.get(MedicineImportsService);
  });

  describe('complete', () => {
    it('rejects already-completed imports', async () => {
      dataSource.transaction.mockImplementation(async (cb: any) =>
        cb({
          getRepository: () => ({
            findOne: jest.fn().mockResolvedValue({
              id: 'i1',
              status: ImportStatus.COMPLETED,
              items: [],
            }),
          }),
        }),
      );
      await expect(service.complete('i1')).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('rejects nonexistent imports', async () => {
      dataSource.transaction.mockImplementation(async (cb: any) =>
        cb({
          getRepository: () => ({
            findOne: jest.fn().mockResolvedValue(null),
          }),
        }),
      );
      await expect(service.complete('i1')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('increments stock for each item and marks as completed', async () => {
      const incrementSpy = jest.fn();
      const saveSpy = jest.fn();
      let lookupCount = 0;

      dataSource.transaction.mockImplementation(async (cb: any) =>
        cb({
          getRepository: (entity: any) => {
            if (entity === MedicineImport) {
              return {
                findOne: jest.fn().mockImplementation(() => {
                  lookupCount += 1;
                  if (lookupCount === 1) {
                    return Promise.resolve({
                      id: 'i1',
                      status: ImportStatus.PENDING,
                      items: [
                        { medicineId: 'm1', quantity: 10 },
                        { medicineId: 'm2', quantity: 5 },
                      ],
                    });
                  }
                  return Promise.resolve({
                    id: 'i1',
                    status: ImportStatus.COMPLETED,
                  });
                }),
                save: saveSpy,
              };
            }
            if (entity === Medicine) {
              return { increment: incrementSpy };
            }
            return {};
          },
        }),
      );

      await service.complete('i1');
      expect(incrementSpy).toHaveBeenCalledTimes(2);
      expect(incrementSpy).toHaveBeenCalledWith(
        { id: 'm1' },
        'stockQuantity',
        10,
      );
      expect(incrementSpy).toHaveBeenCalledWith(
        { id: 'm2' },
        'stockQuantity',
        5,
      );
      expect(saveSpy).toHaveBeenCalled();
    });
  });

  describe('cancel', () => {
    it('blocks cancelling a completed import', async () => {
      importRepo.findOne.mockResolvedValue({
        id: 'i1',
        status: ImportStatus.COMPLETED,
      });
      await expect(service.cancel('i1')).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });
  });

  describe('remove', () => {
    it('blocks deleting a completed import', async () => {
      importRepo.findOne.mockResolvedValue({
        id: 'i1',
        status: ImportStatus.COMPLETED,
      });
      await expect(service.remove('i1')).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });
  });
});
