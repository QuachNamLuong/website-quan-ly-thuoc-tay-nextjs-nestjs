import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, In, Repository } from 'typeorm';
import {
  ImportStatus,
  MedicineImport,
} from './entities/medicine-import.entity';
import { MedicineImportItem } from './entities/medicine-import-item.entity';
import { Medicine } from '../medicines/entities/medicine.entity';
import { Supplier } from '../suppliers/entities/supplier.entity';
import {
  CreateMedicineImportDto,
  CreateMedicineImportItemDto,
  UpdateMedicineImportDto,
} from './dto/medicine-import.dto';
import {
  PaginatedResult,
  PaginationDto,
} from '../../common/dto/pagination.dto';

@Injectable()
export class MedicineImportsService {
  constructor(
    @InjectRepository(MedicineImport)
    private readonly importRepository: Repository<MedicineImport>,
    @InjectRepository(MedicineImportItem)
    private readonly importItemRepository: Repository<MedicineImportItem>,
    @InjectRepository(Medicine)
    private readonly medicineRepository: Repository<Medicine>,
    @InjectRepository(Supplier)
    private readonly supplierRepository: Repository<Supplier>,
    private readonly dataSource: DataSource,
  ) {}

  async paginate(
    dto: PaginationDto,
  ): Promise<PaginatedResult<MedicineImport>> {
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 20;
    const qb = this.importRepository
      .createQueryBuilder('mi')
      .leftJoinAndSelect('mi.supplier', 'supplier')
      .leftJoinAndSelect('mi.importer', 'importer')
      .orderBy('mi.importDate', 'DESC');

    if (dto.search) {
      qb.andWhere('(mi.importCode ILIKE :s OR supplier.name ILIKE :s)', {
        s: `%${dto.search}%`,
      });
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

  async findOne(id: string): Promise<MedicineImport> {
    const found = await this.importRepository.findOne({
      where: { id },
      relations: {
        supplier: true,
        importer: true,
        items: { medicine: true },
      },
    });
    if (!found) {
      throw new NotFoundException('Không tìm thấy phiếu nhập');
    }
    return found;
  }

  async create(
    userId: string,
    dto: CreateMedicineImportDto,
  ): Promise<MedicineImport> {
    return this.dataSource.transaction(async (manager) => {
      const supplier = await manager.getRepository(Supplier).findOne({
        where: { id: dto.supplierId },
      });
      if (!supplier) {
        throw new NotFoundException('Không tìm thấy nhà cung cấp');
      }

      // Validate medicines
      const medicineIds = Array.from(
        new Set(dto.items.map((i) => i.medicineId)),
      );
      const medicines = await manager
        .getRepository(Medicine)
        .find({ where: { id: In(medicineIds) } });
      if (medicines.length !== medicineIds.length) {
        throw new BadRequestException('Một số thuốc không tồn tại');
      }

      // Build line items + total
      const { items, total } = this.buildItems(dto.items);

      const importEntity = manager.getRepository(MedicineImport).create({
        importCode: this.generateImportCode(),
        supplierId: dto.supplierId,
        importedBy: userId,
        importDate: new Date(dto.importDate),
        notes: dto.notes,
        status: ImportStatus.PENDING,
        totalAmount: total,
      });
      const savedImport = await manager
        .getRepository(MedicineImport)
        .save(importEntity);

      const itemEntities = items.map((it) =>
        manager.getRepository(MedicineImportItem).create({
          ...it,
          importId: savedImport.id,
        }),
      );
      await manager.getRepository(MedicineImportItem).save(itemEntities);

      return this.findOneWithManager(manager, savedImport.id);
    });
  }

  async update(
    id: string,
    dto: UpdateMedicineImportDto,
  ): Promise<MedicineImport> {
    const existing = await this.findOne(id);
    if (existing.status !== ImportStatus.PENDING) {
      throw new BadRequestException(
        'Chỉ có thể chỉnh sửa phiếu nhập đang ở trạng thái chờ',
      );
    }

    return this.dataSource.transaction(async (manager) => {
      if (dto.supplierId !== undefined) {
        const s = await manager
          .getRepository(Supplier)
          .findOne({ where: { id: dto.supplierId } });
        if (!s) throw new NotFoundException('Không tìm thấy nhà cung cấp');
        existing.supplierId = dto.supplierId;
      }
      if (dto.importDate !== undefined) {
        existing.importDate = new Date(dto.importDate);
      }
      if (dto.notes !== undefined) existing.notes = dto.notes;

      if (dto.items) {
        const medicineIds = Array.from(
          new Set(dto.items.map((i) => i.medicineId)),
        );
        const medicines = await manager
          .getRepository(Medicine)
          .find({ where: { id: In(medicineIds) } });
        if (medicines.length !== medicineIds.length) {
          throw new BadRequestException('Một số thuốc không tồn tại');
        }

        await manager
          .getRepository(MedicineImportItem)
          .delete({ importId: id });

        const { items, total } = this.buildItems(dto.items);
        const entities = items.map((it) =>
          manager.getRepository(MedicineImportItem).create({
            ...it,
            importId: id,
          }),
        );
        await manager.getRepository(MedicineImportItem).save(entities);
        existing.totalAmount = total;
      }

      await manager.getRepository(MedicineImport).save(existing);
      return this.findOneWithManager(manager, id);
    });
  }

  /**
   * Marks the import as completed and bumps medicine stock.
   * This is the only point where stock is incremented; idempotent via status check.
   */
  async complete(id: string): Promise<MedicineImport> {
    return this.dataSource.transaction(async (manager) => {
      const importEntity = await manager.getRepository(MedicineImport).findOne({
        where: { id },
        relations: { items: true },
      });
      if (!importEntity) {
        throw new NotFoundException('Không tìm thấy phiếu nhập');
      }
      if (importEntity.status !== ImportStatus.PENDING) {
        throw new BadRequestException(
          'Phiếu nhập đã được xử lý, không thể hoàn tất lại',
        );
      }

      for (const item of importEntity.items) {
        await manager
          .getRepository(Medicine)
          .increment({ id: item.medicineId }, 'stockQuantity', item.quantity);
      }

      importEntity.status = ImportStatus.COMPLETED;
      await manager.getRepository(MedicineImport).save(importEntity);

      return this.findOneWithManager(manager, id);
    });
  }

  async cancel(id: string): Promise<MedicineImport> {
    const importEntity = await this.findOne(id);
    if (importEntity.status === ImportStatus.COMPLETED) {
      throw new BadRequestException(
        'Không thể hủy phiếu nhập đã hoàn tất',
      );
    }
    if (importEntity.status === ImportStatus.CANCELLED) {
      return importEntity;
    }
    importEntity.status = ImportStatus.CANCELLED;
    await this.importRepository.save(importEntity);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const importEntity = await this.findOne(id);
    if (importEntity.status === ImportStatus.COMPLETED) {
      throw new BadRequestException(
        'Không thể xóa phiếu nhập đã hoàn tất',
      );
    }
    await this.importRepository.softRemove(importEntity);
  }

  // ----- Helpers -----

  private buildItems(items: CreateMedicineImportItemDto[]): {
    items: Array<Omit<MedicineImportItem, 'id' | 'import' | 'medicine'>>;
    total: number;
  } {
    let total = 0;
    const mapped = items.map((i) => {
      const subtotal = Number((i.quantity * i.unitPrice).toFixed(2));
      total += subtotal;
      return {
        importId: '', // populated by caller
        medicineId: i.medicineId,
        batchNumber: i.batchNumber,
        expiryDate: new Date(i.expiryDate),
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        subtotal,
      };
    });
    return { items: mapped, total: Number(total.toFixed(2)) };
  }

  private generateImportCode(): string {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
    return `IMP-${yyyy}${mm}${dd}-${rand}`;
  }

  private async findOneWithManager(
    manager: EntityManager,
    id: string,
  ): Promise<MedicineImport> {
    const found = await manager.getRepository(MedicineImport).findOne({
      where: { id },
      relations: {
        supplier: true,
        importer: true,
        items: { medicine: true },
      },
    });
    if (!found) {
      throw new NotFoundException('Không tìm thấy phiếu nhập');
    }
    return found;
  }
}
