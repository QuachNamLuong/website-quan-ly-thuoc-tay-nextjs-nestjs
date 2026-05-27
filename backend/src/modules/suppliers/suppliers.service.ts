import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Supplier } from './entities/supplier.entity';
import { CreateSupplierDto, UpdateSupplierDto } from './dto/supplier.dto';
import {
  PaginatedResult,
  PaginationDto,
} from '../../common/dto/pagination.dto';

@Injectable()
export class SuppliersService {
  constructor(
    @InjectRepository(Supplier)
    private readonly supplierRepository: Repository<Supplier>,
  ) {}

  async paginate(dto: PaginationDto): Promise<PaginatedResult<Supplier>> {
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 20;
    const qb = this.supplierRepository
      .createQueryBuilder('s')
      .orderBy('s.createdAt', 'DESC');

    if (dto.search) {
      qb.where(
        '(s.name ILIKE :s OR s.email ILIKE :s OR s.phone ILIKE :s OR s.taxCode ILIKE :s)',
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

  async findAll(): Promise<Supplier[]> {
    return this.supplierRepository.find({ order: { name: 'ASC' } });
  }

  async findOne(id: string): Promise<Supplier> {
    const supplier = await this.supplierRepository.findOne({ where: { id } });
    if (!supplier) {
      throw new NotFoundException('Không tìm thấy nhà cung cấp');
    }
    return supplier;
  }

  async create(dto: CreateSupplierDto): Promise<Supplier> {
    const supplier = this.supplierRepository.create({
      ...dto,
      isActive: dto.isActive ?? true,
    });
    return this.supplierRepository.save(supplier);
  }

  async update(id: string, dto: UpdateSupplierDto): Promise<Supplier> {
    const supplier = await this.findOne(id);
    Object.assign(supplier, dto);
    return this.supplierRepository.save(supplier);
  }

  async remove(id: string): Promise<void> {
    const supplier = await this.findOne(id);
    await this.supplierRepository.softRemove(supplier);
  }
}
