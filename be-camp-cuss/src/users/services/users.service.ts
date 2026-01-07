import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.services';
import { CreateUserDto, CreateUserResponseDto } from '../dto/create-user.dto';
import { FindUserResponseDto } from '../dto/find-user.dto';
import { UpdateUserDto, UpdateUserResponseDto } from '../dto/update-user.dto';
import { PasswordHelper } from '../../common/helpers/password.helper';
import { StoragesService } from '../../storages/storages.service';
import { StorageUrlHelper } from '../../common/helpers/storage-url.helper';
import { UsersUploadService } from './users-upload.service';
import { PrismaHelper } from '../../common/helpers/prisma.helper';
import { AppLoggerService } from '../../common/loggers/app-logger.service';
import { ErrorHelper } from '../../common/helpers/error.helper';
import { ApiQueryParams } from '../../common/types/api-request.interface';
import { User } from '@prisma/client';
import { MetaResponse } from '../../common/types/api-response.interface';

@Injectable()
export class UsersService {
  private readonly context = UsersService.name;

  constructor(
    private readonly prisma: PrismaService,
    private readonly prismaHelper: PrismaHelper,
    private readonly storages: StoragesService,
    private readonly usersUploadService: UsersUploadService,
    private readonly logger: AppLoggerService,
  ) {}

  async create(dto: CreateUserDto): Promise<CreateUserResponseDto> {
    try {
      await this.prismaHelper.assertUnique('user', 'email', dto.email);
      await this.prismaHelper.assertUnique('user', 'username', dto.username);

      this.logger.debug(
        `Membuat pengguna: ${dto.email} / ${dto.username}`,
        this.context,
      );

      const hashed = await PasswordHelper.hash(dto.password);
      const created = await this.prisma.user.create({
        data: { ...dto, password: hashed },
        select: { id: true, email: true, username: true },
      });

      this.logger.log(
        `Pengguna berhasil dibuat: ${created.id} (${created.email})`,
        this.context,
      );

      return created;
    } catch (err) {
      ErrorHelper.handle(
        err,
        this.logger,
        this.context,
        `Gagal membuat pengguna dengan email ${dto.email} / username ${dto.username}`,
      );
    }
  }

  async findAll(
    query: ApiQueryParams,
  ): Promise<{ data: FindUserResponseDto[]; meta: MetaResponse }> {
    try {
      let where = {};

      const page = Number(query.page) || 1;
      const limit = Number(query.limit) || 10;
      const skip = (page - 1) * limit;

      const search = query.search
        ? ({
            fields: ['username', 'email', 'no_phone'],
            query: String(query.search),
            mode: 'insensitive',
          } as const)
        : undefined;

      if (search) {
        where = {
          OR: search.fields.map((field) => ({
            [field]: { contains: search.query, mode: search.mode },
          })),
        };
      }

      const [rawData, totalData] = await Promise.all([
        this.prismaHelper.findAllRecords('user', {
          take: limit,
          skip: skip,
          where,
          orderBy: {
            [query.sortBy || 'created_at']: query.sortOrder || 'desc',
          },
        }),
        this.prisma.user.count({ where }),
      ]);

      if (rawData.length === 0) {
        this.logger.debug(
          'Tidak ada pengguna ditemukan pada findAll',
          this.context,
        );
        return {
          data: [],
          meta: { total: 0, page, last_page: 0, per_page: limit },
        };
      }

      const storageHelper = StorageUrlHelper.create(this.storages, this.logger);
      const usersWithUrls = await storageHelper.buildFileUrlsForArray(
        rawData as User[],
      );

      this.logger.debug(
        `Mengembalikan ${usersWithUrls.length} pengguna dari findAll`,
        this.context,
      );

      const meta: MetaResponse = {
        total: totalData,
        page,
        last_page: Math.ceil(totalData / limit),
        per_page: limit,
      };

      return { data: usersWithUrls as FindUserResponseDto[], meta };
    } catch (err) {
      ErrorHelper.handle(
        err,
        this.logger,
        this.context,
        'Gagal mengambil daftar pengguna',
      );
      throw err;
    }
  }

  async findOne(id: number): Promise<FindUserResponseDto> {
    try {
      const rawData = await this.prismaHelper.findRecord('user', 'id', id);

      if (!rawData) {
        this.logger.warn(
          `Pengguna tidak ditemukan pada findOne (id: ${id})`,
          this.context,
        );
        throw new HttpException(
          'Pengguna tidak ditemukan',
          HttpStatus.NOT_FOUND,
        );
      }

      const storageHelper = StorageUrlHelper.create(this.storages, this.logger);
      const userWithUrls = await storageHelper.buildFileUrls(rawData as User);

      this.logger.debug(
        `Mengembalikan pengguna dari findOne (id: ${id})`,
        this.context,
      );

      return userWithUrls as FindUserResponseDto;
    } catch (err) {
      ErrorHelper.handle(
        err,
        this.logger,
        this.context,
        `Gagal mengambil data pengguna dengan id ${id}`,
      );
    }
  }

  async update(
    accessUserId: number,
    id: number,
    dto: UpdateUserDto,
  ): Promise<UpdateUserResponseDto> {
    try {
      if (accessUserId !== id) {
        this.logger.warn(
          `Akses ditolak untuk update (accessUserId: ${accessUserId}, id: ${id})`,
          this.context,
        );
        throw new HttpException('Akses ditolak', HttpStatus.FORBIDDEN);
      }

      const existing = await this.prisma.user.findUnique({ where: { id } });

      if (!existing) {
        this.logger.warn(
          `Pengguna tidak ditemukan pada update (id: ${id})`,
          this.context,
        );
        throw new HttpException(
          'Pengguna tidak ditemukan',
          HttpStatus.NOT_FOUND,
        );
      }

      const password = dto.password
        ? await PasswordHelper.hash(dto.password)
        : existing.password;

      const updated = await this.prisma.user.update({
        where: { id },
        data: { ...dto, password },
      });

      this.logger.log(`Pengguna berhasil diperbarui (id: ${id})`, this.context);

      return updated;
    } catch (err) {
      ErrorHelper.handle(
        err,
        this.logger,
        this.context,
        `Gagal memperbarui data pengguna dengan id ${id}`,
      );
    }
  }

  async remove(id: number): Promise<{ message: string }> {
    try {
      await this.usersUploadService.deleteAllUserFiles(id);
      await this.prisma.user.delete({ where: { id } });

      this.logger.log(`Pengguna berhasil dihapus (id: ${id})`, this.context);

      return { message: `Pengguna ${id} dihapus` };
    } catch (err) {
      ErrorHelper.handle(
        err,
        this.logger,
        this.context,
        `Gagal menghapus pengguna dengan id ${id}`,
      );
    }
  }
}
