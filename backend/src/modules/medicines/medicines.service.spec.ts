import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { MedicinesService } from './medicines.service';
import { Medicine, MedicineUnit } from './entities/medicine.entity';
import { MedicineCategory } from './entities/medicine-category.entity';

type Mock<T> = { [K in keyof T]: jest.Mock };

const repoMock = <T extends object>(): Mock<Repository<T>> =>
  ({
    findOne: jest.fn(),
    find: jest.fn(),
    save: jest.fn(),
    create: jest.fn((dto) => dto),
    softRemove: jest.fn(),
    createQueryBuilder: jest.fn(),
  }) as unknown as Mock<Repository<T>>;

describe('MedicinesService', () => {
  let service: MedicinesService;
  let medicineRepo: Mock<Repository<Medicine>>;
  let categoryRepo: Mock<Repository<MedicineCategory>>;

  beforeEach(async () => {
    medicineRepo = repoMock<Medicine>();
    categoryRepo = repoMock<MedicineCategory>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MedicinesService,
        { provide: getRepositoryToken(Medicine), useValue: medicineRepo },
        { provide: getRepositoryToken(MedicineCategory), useValue: categoryRepo },
      ],
    }).compile();

    service = module.get(MedicinesService);
  });

  describe('create', () => {
    it('throws ConflictException when code already exists', async () => {
      medicineRepo.findOne.mockResolvedValue({ id: 'x' });
      await expect(
        service.create({
          code: 'A1',
          name: 'Paracetamol',
          unit: MedicineUnit.TABLET,
          price: 10,
        }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('persists a new medicine when code is unique', async () => {
      medicineRepo.findOne.mockResolvedValue(null);
      medicineRepo.save.mockImplementation(async (m) => ({
        ...(m as Medicine),
        id: 'new',
      }));

      const result = await service.create({
        code: 'A1',
        name: 'Paracetamol',
        unit: MedicineUnit.TABLET,
        price: 10,
      });

      expect(medicineRepo.create).toHaveBeenCalled();
      expect(medicineRepo.save).toHaveBeenCalled();
      expect(result.id).toBe('new');
    });

    it('validates category if categoryId provided', async () => {
      medicineRepo.findOne.mockResolvedValue(null);
      categoryRepo.findOne.mockResolvedValue(null);

      await expect(
        service.create({
          code: 'A1',
          name: 'X',
          unit: MedicineUnit.TABLET,
          price: 1,
          categoryId: '00000000-0000-0000-0000-000000000001',
        }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('findOne', () => {
    it('throws NotFoundException when missing', async () => {
      medicineRepo.findOne.mockResolvedValue(null);
      await expect(service.findOne('id')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('returns medicine when found', async () => {
      const m = { id: 'id', name: 'P' } as Medicine;
      medicineRepo.findOne.mockResolvedValue(m);
      await expect(service.findOne('id')).resolves.toEqual(m);
    });
  });

  describe('update', () => {
    it('blocks duplicate code', async () => {
      medicineRepo.findOne
        .mockResolvedValueOnce({ id: 'a', code: 'OLD' }) // findOne in update
        .mockResolvedValueOnce({ id: 'b' }); // findByCode
      await expect(service.update('a', { code: 'NEW' })).rejects.toBeInstanceOf(
        ConflictException,
      );
    });

    it('updates fields when valid', async () => {
      const existing = {
        id: 'a',
        code: 'OLD',
        name: 'X',
        price: 1,
        unit: MedicineUnit.TABLET,
      } as Medicine;
      medicineRepo.findOne.mockResolvedValue(existing);
      medicineRepo.save.mockImplementation(async (m) => m as Medicine);

      const result = await service.update('a', { name: 'Updated', price: 25 });
      expect(result.name).toBe('Updated');
      expect(result.price).toBe(25);
    });
  });

  describe('remove', () => {
    it('soft-removes existing medicine', async () => {
      const m = { id: 'a' } as Medicine;
      medicineRepo.findOne.mockResolvedValue(m);
      await service.remove('a');
      expect(medicineRepo.softRemove).toHaveBeenCalledWith(m);
    });
  });
});
