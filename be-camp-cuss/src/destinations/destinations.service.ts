import {
  Injectable,
  ConflictException,
  NotFoundException,
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

@Injectable()
export class DestinationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storages: StoragesService,
  ) {}

  async create(
    dto: CreateDestinationDto,
  ): Promise<responseCreateDestinationDto> {
    try {
      const exists = await this.prisma.destination.findUnique({
        where: { name: dto.name },
      });

      if (exists) {
        throw new ConflictException({
          message: 'Validasi gagal',
          errors: { name: 'Destinasi dengan nama tersebut sudah ada' },
        });
      }

      const created = await this.prisma.destination.create({ data: dto });

      if (created.image_place) {
        const imagePlaceUrl = this.storages.buildPublicUrl(created.image_place);
        return { ...created, image_place: imagePlaceUrl };
      }

      return { ...created, image_place: null };
    } catch (error) {
      PrismaErrorHelper.handle(error);
      throw error;
    }
  }

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

      if (data.length === 0) {
        throw new NotFoundException({
          message: 'Tidak ada destinasi',
          errors: { destination: 'Tidak ada data destinasi ditemukan' },
        });
      }

      for (const destination of data) {
        destination.image_place = destination.image_place
          ? this.storages.buildPublicUrl(destination.image_place)
          : null;
      }

      return {
        data,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
          hasNextPage: page * limit < total,
        },
      };
    } catch (error) {
      PrismaErrorHelper.handle(error);
    }
  }

  async findOne(id: number): Promise<Destination> {
    try {
      const destination = await this.prisma.destination.findUnique({
        where: { id },
      });

      const imagePlaceUrl = destination?.image_place
        ? this.storages.buildPublicUrl(destination.image_place)
        : null;

      if (!destination) {
        throw new NotFoundException({
          message: 'Destinasi tidak ditemukan',
          errors: { id: `Tidak ada destinasi dengan ID ${id}` },
        });
      }

      return {
        ...destination,
        image_place: imagePlaceUrl,
      };
    } catch (error) {
      PrismaErrorHelper.handle(error);
    }
  }

  async update(
    dto: UpdateDestinationDto,
  ): Promise<responseUpdateDestinationDto> {
    const { id, ...data } = dto;
    try {
      const existing = await this.prisma.destination.findUnique({
        where: { id },
      });
      if (!existing) {
        throw new NotFoundException({
          message: 'Destinasi tidak ditemukan',
          errors: { id: `Tidak ada destinasi dengan ID ${id}` },
        });
      }

      if (data.name && data.name !== existing.name) {
        const nameUsed = await this.prisma.destination.findFirst({
          where: { name: data.name },
        });
        if (nameUsed) {
          throw new ConflictException({
            message: 'Validasi gagal',
            errors: { name: 'Nama destinasi sudah digunakan' },
          });
        }
      }

      const updated = await this.prisma.destination.update({
        where: { id },
        data,
      });

      const imagePlaceUrl = updated?.image_place
        ? this.storages.buildPublicUrl(updated.image_place)
        : null;

      return { ...updated, image_place: imagePlaceUrl };
    } catch (error) {
      PrismaErrorHelper.handle(error);
    }
  }

  async updateImagePlace(
    id: number,
    image_place: string,
  ): Promise<Destination> {
    try {
      const existing = await this.prisma.destination.findUnique({
        where: { id },
      });

      if (!existing) {
        throw new NotFoundException({
          message: 'Destinasi tidak ditemukan',
          errors: { id: `Tidak ada destinasi dengan ID ${id}` },
        });
      }

      const updated = await this.prisma.destination.update({
        where: { id },
        data: { image_place },
      });

      const imagePlaceUrl = updated?.image_place
        ? this.storages.buildPublicUrl(updated.image_place)
        : null;

      return { ...updated, image_place: imagePlaceUrl };
    } catch (error) {
      PrismaErrorHelper.handle(error);
    }
  }

  async remove(id: number): Promise<{ message: string }> {
    try {
      const exists = await this.prisma.destination.findUnique({
        where: { id },
      });
      if (!exists) {
        throw new NotFoundException({
          message: 'Destinasi tidak ditemukan',
          errors: { id: `Tidak ada destinasi dengan ID ${id}` },
        });
      }

      if (exists.image_place) {
        await this.storages.delete(exists.image_place, true);
      }

      await this.prisma.destination.delete({ where: { id } });
      return { message: `Destinasi dengan ID ${id} berhasil dihapus` };
    } catch (error) {
      PrismaErrorHelper.handle(error);
    }
  }
}
