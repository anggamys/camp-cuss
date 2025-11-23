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
import { ValidationHelper } from '../../common/helpers/validation.helper';
import { AppLoggerService } from '../../common/loggers/app-logger.service';

@Injectable()
export class UsersService {
  private readonly context = UsersService.name;

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
    private readonly validationHelper: ValidationHelper,
    private readonly storages: StoragesService,
    private readonly usersUploadService: UsersUploadService,
    private readonly logger: AppLoggerService,
  ) {}

  async create(dto: CreateUserDto): Promise<CreateUserResponseDto> {
    try {
      await this.validationHelper.assertUnique('user', 'email', dto.email);
      await this.validationHelper.assertUnique(
        'user',
        'username',
        dto.username,
      );
      this.logger.debug(
        `Creating user: ${dto.email} / ${dto.username}`,
        this.context,
      );
      const hashed = await PasswordHelper.hash(dto.password);
      const created = await this.prisma.user.create({
        data: { ...dto, password: hashed },
        select: { id: true, email: true, username: true },
      });
      this.logger.log(
        `User created: ${created.id} (${created.email})`,
        this.context,
      );
      return created;
    } catch (err) {
      this.logger.error(
        `Error creating user: ${err instanceof Error ? err.message : err}`,
        this.context,
      );
      PrismaErrorHelper.handle(err);
    }
  }

  async findAll(): Promise<FindUserResponseDto[]> {
    try {
      const users = await this.prisma.user.findMany({
        select: {
          ...this.USER_SELECT,
          photo_profile: true,
        },
      });
      if (users.length === 0) {
        this.logger.debug('No users found in findAll', this.context);
        return [];
      }
      const storageHelper = StorageUrlHelper.create(this.storages, this.logger);
      const usersWithUrls = await storageHelper.buildFileUrlsForArray(users);
      this.logger.debug(
        `Returning ${usersWithUrls.length} users from findAll`,
        this.context,
      );
      return usersWithUrls as FindUserResponseDto[];
    } catch (error) {
      this.logger.error(
        `Error in findAll: ${error instanceof Error ? error.message : error}`,
        this.context,
      );
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
      if (!user) {
        this.logger.warn(`User not found in findOne (id: ${id})`, this.context);
        throw new HttpException(
          'Pengguna tidak ditemukan',
          HttpStatus.NOT_FOUND,
        );
      }
      const storageHelper = StorageUrlHelper.create(this.storages, this.logger);
      const userWithUrls = await storageHelper.buildFileUrls(user);
      this.logger.debug(
        `Returning user from findOne (id: ${id})`,
        this.context,
      );
      return userWithUrls as FindUserResponseDto;
    } catch (error) {
      this.logger.error(
        `Error in findOne (id: ${id}): ${error instanceof Error ? error.message : error}`,
        this.context,
      );
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
      if (accessUserId !== id) {
        this.logger.warn(
          `Access denied for update (accessUserId: ${accessUserId}, id: ${id})`,
          this.context,
        );
        throw new HttpException('Akses ditolak', HttpStatus.FORBIDDEN);
      }
      const existing = await this.prisma.user.findUnique({ where: { id } });
      if (!existing) {
        this.logger.warn(`User not found in update (id: ${id})`, this.context);
        throw new HttpException('User tidak ditemukan', HttpStatus.NOT_FOUND);
      }
      const password = dto.password
        ? await PasswordHelper.hash(dto.password)
        : existing.password;
      const updated = await this.prisma.user.update({
        where: { id },
        data: { ...dto, password },
        select: this.USER_SELECT,
      });
      this.logger.log(`User updated (id: ${id})`, this.context);
      return updated;
    } catch (error) {
      this.logger.error(
        `Error in update (id: ${id}): ${error instanceof Error ? error.message : error}`,
        this.context,
      );
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
      this.logger.log(`User deleted (id: ${id})`, this.context);
      return { message: `Pengguna ${id} dihapus` };
    } catch (error) {
      this.logger.error(
        `Error in remove (id: ${id}): ${error instanceof Error ? error.message : error}`,
        this.context,
      );
      PrismaErrorHelper.handle(error);
    }
  }
}
