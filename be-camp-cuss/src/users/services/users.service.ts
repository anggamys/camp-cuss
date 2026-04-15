import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.services';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { PasswordHelper } from '../../common/helpers/password.helper';
import { StoragesService } from '../../storages/storages.service';
import { StorageUrlHelper } from '../../common/helpers/storage-url.helper';
import { UsersUploadService } from './users-upload.service';
import { AppLoggerService } from '../../common/loggers/app-logger.service';
import { ErrorHelper } from '../../common/helpers/error.helper';
import { ApiQueryParams } from '../../common/types/api-request.interface';
import { MetaResponse } from '../../common/types/api-response.interface';
import { UserResponseDto } from '../dto/user-response.dto';
import { ApprovalStatus, Role } from '../../common/enums/user.enum';

@Injectable()
export class UsersService {
  private readonly context = UsersService.name;

  constructor(
    private readonly prisma: PrismaService,
    private readonly storages: StoragesService,
    private readonly usersUploadService: UsersUploadService,
    private readonly logger: AppLoggerService,
  ) {}

  async create(dto: CreateUserDto): Promise<UserResponseDto> {
    try {
      const emailExists = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });

      if (emailExists) {
        throw new HttpException(
          'Email sudah terdaftar',
          HttpStatus.BAD_REQUEST,
        );
      }

      const usernameExists = await this.prisma.user.findUnique({
        where: { username: dto.username },
      });

      if (usernameExists) {
        throw new HttpException(
          'Username sudah terdaftar',
          HttpStatus.BAD_REQUEST,
        );
      }

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

      const data: UserResponseDto = {
        id: created.id,
        email: created.email,
        username: created.username,
      };

      return data;
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
  ): Promise<{ data: UserResponseDto[]; meta: MetaResponse }> {
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
        this.prisma.user.findMany({
          take: limit,
          skip: skip,
          select: {
            id: true,
            username: true,
            npm: true,
            email: true,
            driver_status: true,
            no_phone: true,
            photo_profile: true,
            role: true,
            created_at: true,
            updated_at: true,
          },
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
      const usersWithUrls = await storageHelper.buildFileUrlsForArray(rawData);

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

      const data: UserResponseDto[] = usersWithUrls.map((user) => ({
        id: user.id as number,
        username: user.username as string,
        npm: user.npm as string,
        email: user.email as string,
        DriverStatus: user.driver_status as string,
        noPhone: user.no_phone as string,
        photoProfile: user.photo_profile as string,
        role: user.role as Role,
        createdAt: user.created_at as Date,
        updatedAt: user.updated_at as Date,
      }));

      return { data, meta };
    } catch (err) {
      ErrorHelper.handle(
        err,
        this.logger,
        this.context,
        'Gagal mengambil daftar pengguna',
      );
    }
  }

  async findOne(id: number): Promise<UserResponseDto> {
    try {
      const rawData = await this.prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          username: true,
          npm: true,
          email: true,
          driver_status: true,
          no_phone: true,
          photo_profile: true,
          role: true,
          photo_id_card: true,
          photo_student_card: true,
          photo_driving_license: true,
          created_at: true,
          updated_at: true,
        },
      });

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
      const userWithUrls = await storageHelper.buildFileUrls(rawData);

      this.logger.debug(
        `Mengembalikan pengguna dari findOne (id: ${id})`,
        this.context,
      );

      const data: UserResponseDto = {
        id: userWithUrls.id as number,
        username: userWithUrls.username as string,
        npm: userWithUrls.npm as string,
        email: userWithUrls.email as string,
        driverStatus: userWithUrls.driver_status as ApprovalStatus,
        noPhone: userWithUrls.no_phone as string,
        photoProfile: userWithUrls.photo_profile as string,
        role: userWithUrls.role as Role,
        photoIdCard: userWithUrls.photo_id_card as string,
        photoStudentCard: userWithUrls.photo_student_card as string,
        photoDriverLicense: userWithUrls.photo_driving_license as string,
        createdAt: userWithUrls.created_at as Date,
        updatedAt: userWithUrls.updated_at as Date,
      };

      return data;
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
  ): Promise<UserResponseDto> {
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
        select: {
          id: true,
          username: true,
          npm: true,
          email: true,
          driver_status: true,
          no_phone: true,
          photo_profile: true,
          role: true,
          photo_id_card: true,
          photo_student_card: true,
          photo_driving_license: true,
          created_at: true,
          updated_at: true,
        },
        data: { ...dto, password },
      });

      this.logger.log(`Pengguna berhasil diperbarui (id: ${id})`, this.context);

      const storageHelper = StorageUrlHelper.create(this.storages, this.logger);
      const userWithUrls = await storageHelper.buildFileUrls(updated);

      const data: UserResponseDto = {
        id: userWithUrls.id as number,
        username: userWithUrls.username as string,
        npm: userWithUrls.npm as string,
        email: userWithUrls.email as string,
        driverStatus: userWithUrls.driver_status as ApprovalStatus,
        noPhone: userWithUrls.no_phone as string,
        photoProfile: userWithUrls.photo_profile as string,
        role: userWithUrls.role as Role,
        photoIdCard: userWithUrls.photo_id_card as string,
        photoStudentCard: userWithUrls.photo_student_card as string,
        photoDriverLicense: userWithUrls.photo_driving_license as string,
        createdAt: userWithUrls.created_at as Date,
        updatedAt: userWithUrls.updated_at as Date,
      };

      return data;
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
