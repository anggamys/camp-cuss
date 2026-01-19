import { HttpException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.services';
import { AppLoggerService } from '../common/loggers/app-logger.service';
import { CreateDestinationDto } from './dto/create-destination.dto';
import { StoragesService } from '../storages/storages.service';
import { Destination } from '@prisma/client';
import { ApiQueryParams } from '../common/types/api-request.interface';
import { MetaResponse } from '../common/types/api-response.interface';
import { ErrorHelper } from '../common/helpers/error.helper';
import { StorageUrlHelper } from '../common/helpers/storage-url.helper';
import { DestinationResponseDto } from './dto/destination-response.dto';

@Injectable()
export class DestinationsService {
  private readonly context = DestinationsService.name;

  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: AppLoggerService,
    private readonly storageService: StoragesService,
  ) {}

  async create(dto: CreateDestinationDto): Promise<DestinationResponseDto> {
    try {
      const existing = await this.prisma.destination.findUnique({
        where: { name: dto.name },
      });

      if (existing) {
        throw new HttpException('Nama destinasi sudah digunakan', 409);
      }

      const newDestination = await this.prisma.destination.create({
        data: {
          name: dto.name,
          estimated: dto.estimated,
          image_place: dto.imagePlace,
        },
      });

      this.logger.debug(
        `Destinasi baru berhasil dibuat dengan ID: ${newDestination.id}`,
        this.context,
      );

      return this.toResponseDto(newDestination);
    } catch (err) {
      ErrorHelper.handle(
        err,
        this.logger,
        this.context,
        'Gagal menyimpan data destinasi',
      );
    }
  }

  async getAll(
    query: ApiQueryParams,
  ): Promise<{ data: DestinationResponseDto[]; meta: MetaResponse }> {
    try {
      let where: Record<string, any> = {};

      const page = Number(query.page) > 0 ? Number(query.page) : 1;

      const limit = Number(query.limit) > 0 ? Number(query.limit) : 10;

      const skip = (page - 1) * limit;

      if (query.search) {
        where = {
          OR: [
            { name: { contains: String(query.search), mode: 'insensitive' } },
          ],
        };
      }

      const [rawData, total] = await Promise.all([
        this.prisma.destination.findMany({
          take: limit,
          skip,
          where,
          orderBy: {
            [query.sortBy || 'created_at']: query.sortOrder || 'desc',
          },
        }),
        this.prisma.destination.count({ where }),
      ]);

      const storageHelper = StorageUrlHelper.create(
        this.storageService,
        this.logger,
      );

      const destinationsWithUrls =
        await storageHelper.buildFileUrlsForArray(rawData);

      const data: DestinationResponseDto[] = (
        destinationsWithUrls as Destination[]
      ).map((destination) => this.toResponseDto(destination));

      const meta: MetaResponse = {
        page,
        perPage: limit,
        total,
        totalPages: Math.ceil(total / limit),
      };

      return { data, meta };
    } catch (err) {
      ErrorHelper.handle(
        err,
        this.logger,
        this.context,
        'Gagal mengambil daftar destinasi',
      );
    }
  }

  async getById(id: number): Promise<DestinationResponseDto> {
    try {
      const destination = await this.prisma.destination.findUnique({
        where: { id },
      });

      if (!destination) {
        throw new HttpException('Destinasi tidak ditemukan', 404);
      }

      const storageHelper = StorageUrlHelper.create(
        this.storageService,
        this.logger,
      );

      await storageHelper.buildFileUrls(destination);

      return this.toResponseDto(destination);
    } catch (err) {
      ErrorHelper.handle(
        err,
        this.logger,
        this.context,
        `Gagal mengambil destinasi dengan ID: ${id}`,
      );
    }
  }

  async update(
    id: number,
    dto: Partial<CreateDestinationDto>,
  ): Promise<DestinationResponseDto> {
    try {
      const destination = await this.prisma.destination.findUnique({
        where: { id },
      });

      if (!destination) {
        throw new HttpException('Destinasi tidak ditemukan', 404);
      }

      if (dto.name && dto.name !== destination.name) {
        const existing = await this.prisma.destination.findUnique({
          where: { name: dto.name },
        });

        if (existing) {
          throw new HttpException('Nama destinasi sudah digunakan', 409);
        }
      }

      const updatedDestination = await this.prisma.destination.update({
        where: { id },
        data: {
          name: dto.name,
          estimated: dto.estimated,
        },
      });

      this.logger.debug(
        `Destinasi dengan ID: ${updatedDestination.id} berhasil diperbarui`,
        this.context,
      );

      return this.toResponseDto(updatedDestination);
    } catch (err) {
      ErrorHelper.handle(
        err,
        this.logger,
        this.context,
        `Gagal memperbarui destinasi dengan ID: ${id}`,
      );
    }
  }

  async delete(id: number): Promise<void> {
    try {
      const destination = await this.prisma.destination.findUnique({
        where: { id },
      });

      if (!destination) {
        throw new HttpException('Destinasi tidak ditemukan', 404);
      }

      if (destination.image_place) {
        await this.storageService.delete(destination.image_place);
      }

      await this.prisma.destination.delete({ where: { id } });

      this.logger.debug(
        `Destinasi dengan ID: ${id} berhasil dihapus`,
        this.context,
      );
    } catch (err) {
      ErrorHelper.handle(
        err,
        this.logger,
        this.context,
        `Gagal menghapus destinasi dengan ID: ${id}`,
      );
    }
  }

  async updateImagePlace(
    id: number,
    file: Express.Multer.File,
  ): Promise<string> {
    try {
      const destination = await this.prisma.destination.findUnique({
        where: { id },
      });

      if (!destination) {
        throw new HttpException('Destinasi tidak ditemukan', 404);
      }

      if (destination.image_place) {
        await this.storageService.delete(destination.image_place);
      }

      const updatedDestination = await this.prisma.destination.update({
        where: { id },
        data: {
          image_place: file.filename,
        },
      });

      this.logger.debug(
        `Gambar destinasi dengan ID: ${updatedDestination.id} berhasil diperbarui`,
        this.context,
      );

      return updatedDestination.image_place ?? '';
    } catch (err) {
      ErrorHelper.handle(
        err,
        this.logger,
        this.context,
        `Gagal memperbarui gambar destinasi dengan ID: ${id}`,
      );
    }
  }

  private toResponseDto(entity: Destination): DestinationResponseDto {
    return {
      id: entity.id,
      name: entity.name,
      imagePlace: entity.image_place ?? undefined,
      estimatedTime: entity.estimated,
      createdAt: entity.created_at,
      updatedAt: entity.updated_at,
    };
  }
}
