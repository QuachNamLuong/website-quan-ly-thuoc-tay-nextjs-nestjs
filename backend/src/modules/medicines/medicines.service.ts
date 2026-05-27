import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Medicine } from './entities/medicine.entity';
import { MedicineCategory } from './entities/medicine-category.entity';
import { CreateMedicineDto } from './dto/create-medicine.dto';
import { UpdateMedicineDto } from './dto/update-medicine.dto';
import { FindMedicinesDto } from './dto/find-medicines.dto';
import {
  PaginatedResult,
  PaginationDto,
} from '../../common/dto/pagination.dto';
import {
  CreateMedicineCategoryDto,
  UpdateMedicineCategoryDto,
} from './dto/medicine-category.dto';

@Injectable()
export class MedicinesService {
  constructor(
    @InjectRepository(Medicine)
    private readonly medicineRepository: Repository<Medicine>,
    @InjectRepository(MedicineCategory)
    private readonly categoryRepository: Repository<MedicineCategory>,
  ) {}

  // ----- Medicines -----

  async paginate(dto: FindMedicinesDto): Promise<PaginatedResult<Medicine>> {
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 20;
    const qb = this.medicineRepository
      .createQueryBuilder('m')
      .leftJoinAndSelect('m.category', 'category')
      .orderBy('m.createdAt', 'DESC');

    if (dto.search) {
      qb.andWhere(
        '(m.name ILIKE :s OR m.code ILIKE :s OR m.genericName ILIKE :s)',
        { s: `%${dto.search}%` },
      );
    }
    if (dto.categoryId) {
      qb.andWhere('m.categoryId = :cid', { cid: dto.categoryId });
    }
    if (dto.isActive !== undefined) {
      qb.andWhere('m.isActive = :active', { active: dto.isActive });
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

  async findOne(id: string): Promise<Medicine> {
    const medicine = await this.medicineRepository.findOne({
      where: { id },
      relations: { category: true },
    });
    if (!medicine) {
      throw new NotFoundException('Không tìm thấy thuốc');
    }
    return medicine;
  }

  async findByCode(code: string): Promise<Medicine | null> {
    return this.medicineRepository.findOne({ where: { code } });
  }

  async create(dto: CreateMedicineDto): Promise<Medicine> {
    if (await this.findByCode(dto.code)) {
      throw new ConflictException('Mã thuốc đã tồn tại');
    }
    if (dto.categoryId) {
      await this.findCategoryOrFail(dto.categoryId);
    }

    const medicine = this.medicineRepository.create({
      code: dto.code,
      name: dto.name,
      genericName: dto.genericName,
      manufacturer: dto.manufacturer,
      unit: dto.unit,
      price: dto.price,
      description: dto.description,
      isActive: dto.isActive ?? true,
      categoryId: dto.categoryId ?? null,
      stockQuantity: 0,
    });
    return this.medicineRepository.save(medicine);
  }

  async update(id: string, dto: UpdateMedicineDto): Promise<Medicine> {
    const medicine = await this.findOne(id);

    if (dto.code && dto.code !== medicine.code) {
      if (await this.findByCode(dto.code)) {
        throw new ConflictException('Mã thuốc đã tồn tại');
      }
      medicine.code = dto.code;
    }
    if (dto.categoryId !== undefined) {
      if (dto.categoryId) {
        await this.findCategoryOrFail(dto.categoryId);
      }
      medicine.categoryId = dto.categoryId ?? null;
    }

    if (dto.name !== undefined) medicine.name = dto.name;
    if (dto.genericName !== undefined) medicine.genericName = dto.genericName;
    if (dto.manufacturer !== undefined) medicine.manufacturer = dto.manufacturer;
    if (dto.unit !== undefined) medicine.unit = dto.unit;
    if (dto.price !== undefined) medicine.price = dto.price;
    if (dto.description !== undefined) medicine.description = dto.description;
    if (dto.isActive !== undefined) medicine.isActive = dto.isActive;

    return this.medicineRepository.save(medicine);
  }

  async remove(id: string): Promise<void> {
    const medicine = await this.findOne(id);
    await this.medicineRepository.softRemove(medicine);
  }

  // ----- Categories -----

  async findAllCategories(): Promise<MedicineCategory[]> {
    return this.categoryRepository.find({ order: { name: 'ASC' } });
  }

  async findCategoryOrFail(id: string): Promise<MedicineCategory> {
    const category = await this.categoryRepository.findOne({ where: { id } });
    if (!category) {
      throw new NotFoundException('Không tìm thấy nhóm thuốc');
    }
    return category;
  }

  async createCategory(
    dto: CreateMedicineCategoryDto,
  ): Promise<MedicineCategory> {
    const existing = await this.categoryRepository.findOne({
      where: { name: dto.name },
    });
    if (existing) {
      throw new ConflictException('Tên nhóm thuốc đã tồn tại');
    }
    const category = this.categoryRepository.create(dto);
    return this.categoryRepository.save(category);
  }

  async updateCategory(
    id: string,
    dto: UpdateMedicineCategoryDto,
  ): Promise<MedicineCategory> {
    const category = await this.findCategoryOrFail(id);
    if (dto.name && dto.name !== category.name) {
      const existing = await this.categoryRepository.findOne({
        where: { name: dto.name },
      });
      if (existing) {
        throw new ConflictException('Tên nhóm thuốc đã tồn tại');
      }
      category.name = dto.name;
    }
    if (dto.description !== undefined) category.description = dto.description;
    return this.categoryRepository.save(category);
  }

  async removeCategory(id: string): Promise<void> {
    const category = await this.findCategoryOrFail(id);
    await this.categoryRepository.softRemove(category);
  }
}
