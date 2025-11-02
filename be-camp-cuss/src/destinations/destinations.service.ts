import {
  Injectable,
  ConflictException,
  NotFoundException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import {
  CreateDestinationDto,
  responseCreateDestinationDto,
} from './dto/create-destination.dto';
import {
  UpdateDestinationDto,
  responseUpdateDestinationDto,
} from './dto/update-destination.dto';
import { PrismaService } from '../prisma/prisma.services';
import { PrismaErrorHelper } from '../common/helpers/prisma-error.helper';
import { Destination, Prisma } from '@prisma/client';
import { StoragesService } from '../storages/storages.service';
import { StorageUrlHelper } from '../common/helpers/storage-url.helper';

@Injectable()
export class DestinationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storages: StoragesService,
  ) {}

  // CREATE
  async create(
    dto: CreateDestinationDto,
  ): Promise<responseCreateDestinationDto> {
    try {
      // Validate input
      if (!dto.name || dto.name.trim().length === 0) {
        throw new HttpException(
          'Nama destinasi tidak boleh kosong',
          HttpStatus.BAD_REQUEST,
        );
      }

      const exists = await this.prisma.destination.findUnique({
        where: { name: dto.name.trim() },
      });

      if (exists) {
        throw new ConflictException({
          message: 'Validasi gagal',
          errors: { name: 'Nama destinasi sudah digunakan' },
        });
      }

      const created = await this.prisma.destination.create({
        data: { ...dto, name: dto.name.trim() },
      });

      const storageHelper = StorageUrlHelper.create(this.storages);
      const withUrl = await storageHelper.buildFileUrls(created);

      return withUrl as unknown as responseCreateDestinationDto;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      PrismaErrorHelper.handle(error);
    }
  }

  // FIND ALL
  async findAll(
    search?: string,
    page = 1,
    limit = 10,
  ): Promise<{ data: Destination[]; meta: any }> {
    try {
      const skip = (page - 1) * limit;

      const where: Prisma.DestinationWhereInput = search
        ? { name: { contains: search, mode: 'insensitive' } }
        : {};

      const [data, total] = await Promise.all([
        this.prisma.destination.findMany({
          where,
          skip,
          take: limit,
          orderBy: { name: 'asc' },
        }),
        this.prisma.destination.count({ where }),
      ]);

      const storageHelper = StorageUrlHelper.create(this.storages);
      const enriched = await storageHelper.buildFileUrlsForArray(data);

      return {
        data: enriched as Destination[],
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
          hasNextPage: page * limit < total,
        },
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      PrismaErrorHelper.handle(error);
    }
  }

  // FIND ONE
  async findOne(id: number): Promise<Destination> {
    try {
      const destination = await this.prisma.destination.findUnique({
        where: { id },
      });

      if (!destination)
        throw new NotFoundException({
          message: 'Destinasi tidak ditemukan',
          errors: { id: `Tidak ada destinasi dengan ID ${id}` },
        });

      const storageHelper = StorageUrlHelper.create(this.storages);
      const withUrl = await storageHelper.buildFileUrls(destination);
      return withUrl as Destination;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      PrismaErrorHelper.handle(error);
    }
  }

  // UPDATE
  async update(
    dto: UpdateDestinationDto,
  ): Promise<responseUpdateDestinationDto> {
    const { id, ...data } = dto;

    try {
      // Validate input
      if (data.name && data.name.trim().length === 0) {
        throw new HttpException(
          'Nama destinasi tidak boleh kosong',
          HttpStatus.BAD_REQUEST,
        );
      }

      const existing = await this.prisma.destination.findUnique({
        where: { id },
      });
      if (!existing)
        throw new NotFoundException({
          message: 'Destinasi tidak ditemukan',
          errors: { id: `Tidak ada destinasi dengan ID ${id}` },
        });

      if (data.name && data.name.trim() !== existing.name) {
        const nameUsed = await this.prisma.destination.findFirst({
          where: { name: data.name.trim() },
        });
        if (nameUsed)
          throw new ConflictException({
            message: 'Validasi gagal',
            errors: { name: 'Nama destinasi sudah digunakan' },
          });
      }

      const updateData = { ...data };
      if (data.name) {
        updateData.name = data.name.trim();
      }

      const updated = await this.prisma.destination.update({
        where: { id },
        data: updateData,
      });

      const storageHelper = StorageUrlHelper.create(this.storages);

      const withUrl = await storageHelper.buildFileUrls(updated);

      return withUrl as unknown as responseUpdateDestinationDto;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      PrismaErrorHelper.handle(error);
    }
  }

  // UPDATE FILE
  async updateImagePlace(
    id: number,
    file: Express.Multer.File,
  ): Promise<Destination> {
    try {
      if (!file)
        throw new HttpException('File wajib diunggah', HttpStatus.BAD_REQUEST);

      const existing = await this.prisma.destination.findUnique({
        where: { id },
      });
      if (!existing)
        throw new NotFoundException({
          message: 'Destinasi tidak ditemukan',
          errors: { id: `Tidak ada destinasi dengan ID ${id}` },
        });

      // Hapus file lama
      if (existing.image_place) {
        try {
          await this.storages.delete(existing.image_place, false);
        } catch (deleteError) {
          // Log error but continue with upload
          console.error('Failed to delete old image:', deleteError);
        }
      }

      // Upload file baru
      const uploaded = await this.storages.upload(file, 'destinations', false);

      // Update DB
      const updated = await this.prisma.destination.update({
        where: { id },
        data: { image_place: uploaded.key },
      });

      const storageHelper = StorageUrlHelper.create(this.storages);
      const withUrl = await storageHelper.buildFileUrls(updated);
      return withUrl as Destination;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      PrismaErrorHelper.handle(error);
    }
  }

  // DELETE
  async remove(id: number): Promise<{ message: string }> {
    try {
      const exists = await this.prisma.destination.findUnique({
        where: { id },
      });
      if (!exists)
        throw new NotFoundException({
          message: 'Destinasi tidak ditemukan',
          errors: { id: `Tidak ada destinasi dengan ID ${id}` },
        });

      if (exists.image_place) {
        try {
          await this.storages.delete(exists.image_place, false);
        } catch (deleteError) {
          // Log error but continue with deletion
          console.error('Failed to delete image file:', deleteError);
        }
      }

      await this.prisma.destination.delete({ where: { id } });
      return { message: `Destinasi dengan ID ${id} berhasil dihapus` };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      PrismaErrorHelper.handle(error);
    }
  }
}
