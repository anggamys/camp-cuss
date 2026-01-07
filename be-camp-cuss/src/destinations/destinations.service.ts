import { HttpException, Injectable } from '@nestjs/common';
import { PrismaHelper } from '../common/helpers/prisma.helper';
import { PrismaService } from '../prisma/prisma.services';
import { AppLoggerService } from '../common/loggers/app-logger.service';
import {
  CreateDestinationDto,
  responseCreateDestinationDto,
} from './dto/create-destination.dto';
import { StoragesService } from '../storages/storages.service';
import { Destination } from '@prisma/client';
import { ApiQueryParams } from '../common/types/api-request.interface';
import { MetaResponse } from '../common/types/api-response.interface';
import { ErrorHelper } from '../common/helpers/error.helper';

@Injectable()
export class DestinationsService {
  private readonly context = DestinationsService.name;

  constructor(
    private readonly prismaHelper: PrismaHelper,
    private readonly prisma: PrismaService,
    private readonly logger: AppLoggerService,
    private readonly storageService: StoragesService,
  ) {}

  async create(
    dto: CreateDestinationDto,
  ): Promise<responseCreateDestinationDto> {
    try {
      await this.prismaHelper.assertUnique(
        'destination',
        'name',
        dto.name,
        'Nama destinasi sudah digunakan',
      );

      const newDestination = await this.prisma.destination.create({
        data: {
          name: dto.name,
          estimated: dto.estimated,
        },
      });

      this.logger.debug(
        `Destinasi baru berhasil dibuat dengan ID: ${newDestination.id}`,
        this.context,
      );

      return {
        id: newDestination.id,
        name: newDestination.name,
        image_place: newDestination.image_place,
        estimated: newDestination.estimated,
        created_at: newDestination.created_at,
        updated_at: newDestination.updated_at,
      };
    } catch (err: any) {
      if (err instanceof HttpException) throw err;

      throw new HttpException('Terjadi kesalahan saat membuat destinasi', 500);
    }
  }

  async getAll(
    query: ApiQueryParams,
  ): Promise<{ data: Destination[]; meta: MetaResponse }> {
    try {
      const page = Number(query.page) || 1;
      const limit = Number(query.limit) || 10;
      const skip = (page - 1) * limit;

      const search = query.search
        ? ({
            field: 'name',
            query: String(query.search),
            mode: 'insensitive',
          } as const)
        : undefined;

      const [rawData, total] = await Promise.all([
        this.prismaHelper.findAllRecords('destination', {
          take: limit,
          skip,
          search,
          orderBy: {
            [query.sortBy || 'created_at']: query.sortOrder || 'desc',
          },
        }),
        search
          ? this.prisma.destination.count({
              where: {
                [search.field]: {
                  contains: search.query,
                  mode: search.mode,
                },
              },
            })
          : this.prisma.destination.count(),
      ]);

      const data: Destination[] = rawData as Destination[];

      const meta: MetaResponse = {
        total,
        page,
        last_page: Math.ceil(total / limit),
        per_page: limit,
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

  async getById(id: number): Promise<Destination | null> {
    try {
      const destination: Destination | null =
        await this.prismaHelper.findRecord('destination', 'id', id);

      if (!destination) {
        throw new HttpException('Destinasi tidak ditemukan', 404);
      }

      return destination;
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
  ): Promise<Destination> {
    try {
      const destination: Destination | null =
        await this.prismaHelper.findRecord('destination', 'id', id);

      if (!destination) {
        throw new HttpException('Destinasi tidak ditemukan', 404);
      }

      if (dto.name && dto.name !== destination.name) {
        await this.prismaHelper.assertUnique(
          'destination',
          'name',
          dto.name,
          'Nama destinasi sudah digunakan',
        );
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

      return updatedDestination;
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
      const destination: Destination | null =
        await this.prismaHelper.findRecord('destination', 'id', id);

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
      const destination: Destination | null =
        await this.prismaHelper.findRecord('destination', 'id', id);

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
}
