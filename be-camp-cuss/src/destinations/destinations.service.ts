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
import { destinations, Prisma } from '@prisma/client';

@Injectable()
export class DestinationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    dto: CreateDestinationDto,
  ): Promise<responseCreateDestinationDto> {
    try {
      const exists = await this.prisma.destinations.findFirst({
        where: { name: dto.name },
      });

      if (exists) {
        throw new ConflictException({
          message: 'Validasi gagal',
          errors: { name: 'Destinasi dengan nama tersebut sudah ada' },
        });
      }

      return await this.prisma.destinations.create({ data: dto });
    } catch (error) {
      PrismaErrorHelper.handle(error);
    }
  }

  async findAll(
    search?: string,
    page = 1,
    limit = 10,
  ): Promise<{ data: destinations[]; meta: any }> {
    try {
      const skip = (page - 1) * limit;

      const where: Prisma.destinationsWhereInput = search
        ? { name: { contains: search, mode: 'insensitive' } }
        : {};

      const [data, total] = await Promise.all([
        this.prisma.destinations.findMany({
          where,
          skip,
          take: limit,
          orderBy: { id: 'asc' },
        }),
        this.prisma.destinations.count({ where }),
      ]);

      if (data.length === 0) {
        throw new NotFoundException({
          message: 'Tidak ada destinasi',
          errors: { destination: 'Tidak ada data destinasi ditemukan' },
        });
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

  async findOne(id: number): Promise<destinations> {
    try {
      const destination = await this.prisma.destinations.findUnique({
        where: { id },
      });

      if (!destination) {
        throw new NotFoundException({
          message: 'Destinasi tidak ditemukan',
          errors: { id: `Tidak ada destinasi dengan ID ${id}` },
        });
      }

      return destination;
    } catch (error) {
      PrismaErrorHelper.handle(error);
    }
  }

  async update(
    dto: UpdateDestinationDto,
  ): Promise<responseUpdateDestinationDto> {
    const { id, ...data } = dto;
    try {
      const existing = await this.prisma.destinations.findUnique({
        where: { id },
      });
      if (!existing) {
        throw new NotFoundException({
          message: 'Destinasi tidak ditemukan',
          errors: { id: `Tidak ada destinasi dengan ID ${id}` },
        });
      }

      if (data.name && data.name !== existing.name) {
        const nameUsed = await this.prisma.destinations.findFirst({
          where: { name: data.name },
        });
        if (nameUsed) {
          throw new ConflictException({
            message: 'Validasi gagal',
            errors: { name: 'Nama destinasi sudah digunakan' },
          });
        }
      }

      return await this.prisma.destinations.update({ where: { id }, data });
    } catch (error) {
      PrismaErrorHelper.handle(error);
    }
  }

  async remove(id: number): Promise<{ message: string }> {
    try {
      const exists = await this.prisma.destinations.findUnique({
        where: { id },
      });
      if (!exists) {
        throw new NotFoundException({
          message: 'Destinasi tidak ditemukan',
          errors: { id: `Tidak ada destinasi dengan ID ${id}` },
        });
      }

      await this.prisma.destinations.delete({ where: { id } });
      return { message: `Destinasi dengan ID ${id} berhasil dihapus` };
    } catch (error) {
      PrismaErrorHelper.handle(error);
    }
  }
}
