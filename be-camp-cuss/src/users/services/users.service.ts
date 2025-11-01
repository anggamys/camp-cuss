import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.services';
import { CreateUserDto, CreateUserResponseDto } from '../dto/create-user.dto';
import { FindUserResponseDto } from '../dto/find-user.dto';
import { UpdateUserDto, UpdateUserResponseDto } from '../dto/update-user.dto';
import { PasswordHelper } from '../../common/helpers/password.helper';
import { PrismaErrorHelper } from '../../common/helpers/prisma-error.helper';
import { StoragesService } from '../../storages/storages.service';
import { StorageUrlHelper } from '../../common/helpers/storage-url.helper';
import { UsersUploadService } from './users-upload.service';

@Injectable()
export class UsersService {
  private readonly USER_SELECT = {
    id: true,
    username: true,
    email: true,
    npm: true,
    no_phone: true,
    role: true,
  };

  constructor(
    private readonly prisma: PrismaService,
    private readonly storages: StoragesService,
    private readonly usersUploadService: UsersUploadService,
  ) {}

  async create(dto: CreateUserDto): Promise<CreateUserResponseDto> {
    try {
      await this.validateUnique(dto.email, dto.username);
      const hashed = await PasswordHelper.hash(dto.password);
      return this.prisma.user.create({
        data: { ...dto, password: hashed },
        select: { id: true, email: true, username: true },
      });
    } catch (err) {
      PrismaErrorHelper.handle(err);
    }
  }

  async findAll(): Promise<FindUserResponseDto[]> {
    try {
      const users = await this.prisma.user.findMany({
        select: {
          ...this.USER_SELECT,
          photo_profile: true, // Include photo_profile for URL building
        },
      });

      if (users.length === 0) {
        return []; // Return empty array instead of throwing error
      }

      // Build URLs for profile photos
      const storageHelper = StorageUrlHelper.create(this.storages);
      const usersWithUrls = await storageHelper.buildFileUrlsForArray(users);

      return usersWithUrls as FindUserResponseDto[];
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      PrismaErrorHelper.handle(error);
    }
  }

  async findOne(id: number): Promise<FindUserResponseDto> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id },
        select: {
          ...this.USER_SELECT,
          photo_driving_license: true,
          photo_id_card: true,
          photo_profile: true,
          photo_student_card: true,
        },
      });

      if (!user)
        throw new HttpException(
          'Pengguna tidak ditemukan',
          HttpStatus.NOT_FOUND,
        );

      const storageHelper = StorageUrlHelper.create(this.storages);
      const userWithUrls = await storageHelper.buildFileUrls(user);

      return userWithUrls as FindUserResponseDto;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      PrismaErrorHelper.handle(error);
    }
  }

  async update(
    accessUserId: number,
    id: number,
    dto: UpdateUserDto,
  ): Promise<UpdateUserResponseDto> {
    try {
      if (accessUserId !== id)
        throw new HttpException('Akses ditolak', HttpStatus.FORBIDDEN);

      const existing = await this.prisma.user.findUnique({ where: { id } });
      if (!existing)
        throw new HttpException('User tidak ditemukan', HttpStatus.NOT_FOUND);

      const password = dto.password
        ? await PasswordHelper.hash(dto.password)
        : existing.password;

      return this.prisma.user.update({
        where: { id },
        data: { ...dto, password },
        select: this.USER_SELECT,
      });
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      PrismaErrorHelper.handle(error);
    }
  }

  async remove(id: number): Promise<{ message: string }> {
    try {
      await this.usersUploadService.deleteAllUserFiles(id);

      await this.prisma.user.delete({ where: { id } });
      return { message: `Pengguna ${id} dihapus` };
    } catch (error) {
      PrismaErrorHelper.handle(error);
    }
  }

  private async validateUnique(email: string, username: string) {
    try {
      const [e, u] = await Promise.all([
        this.prisma.user.findUnique({ where: { email } }),
        this.prisma.user.findUnique({ where: { username } }),
      ]);

      if (e || u)
        throw new HttpException(
          {
            message: 'Validasi gagal',
            errors: {
              ...(e && { email: 'Email sudah digunakan' }),
              ...(u && { username: 'Username sudah digunakan' }),
            },
          },
          HttpStatus.BAD_REQUEST,
        );
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      PrismaErrorHelper.handle(error);
    }
  }
}
