import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.services';
import { CreateUserDto, CreateUserResponseDto } from './dto/create-user.dto';
import { FindUserResponseDto } from './dto/find-user.dto';
import { UpdateUserDto, UpdateUserResponseDto } from './dto/update-user.dto';
import { PasswordHelper } from '../common/helpers/password.helper';
import { PrismaErrorHelper } from '../common/helpers/prisma-error.helper';
import { StoragesService } from '../storages/storages.service';

@Injectable()
export class UsersService {
  private readonly USER_SELECT_FIELDS = {
    id: true,
    username: true,
    email: true,
    npm: true,
    no_phone: true,
    role: true,
    photo_profile: true,
  };

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StoragesService,
  ) {}

  async create(dto: CreateUserDto): Promise<CreateUserResponseDto> {
    try {
      await this.validateUniqueFields(dto.email, dto.username);
      const hashedPassword = await PasswordHelper.hash(dto.password);
      return await this.prisma.users.create({
        data: { ...dto, password: hashedPassword },
        select: { id: true, email: true },
      });
    } catch (error) {
      PrismaErrorHelper.handle(error);
    }
  }

  async findAll(): Promise<FindUserResponseDto[]> {
    try {
      const users = await this.prisma.users.findMany({
        select: this.USER_SELECT_FIELDS,
      });

      if (!users.length) {
        throw new HttpException(
          'Pengguna tidak ditemukan',
          HttpStatus.NOT_FOUND,
        );
      }

      return users;
    } catch (error) {
      PrismaErrorHelper.handle(error);
    }
  }

  async findOne(id: number): Promise<FindUserResponseDto> {
    const user = await this.prisma.users.findUnique({
      where: { id },
      select: this.USER_SELECT_FIELDS,
    });
    if (!user)
      this.throwNotFound('Pengguna tidak ditemukan', 'ID tidak ditemukan');
    return user;
  }

  async update(
    accessUserId: number,
    id: number,
    dto: UpdateUserDto,
  ): Promise<UpdateUserResponseDto> {
    if (accessUserId !== id)
      throw new HttpException('Akses ditolak', HttpStatus.FORBIDDEN);
    const existingUser = await this.findUserById(id);
    await this.validateUniqueFieldsForUpdate(dto, existingUser);
    const password = dto.password
      ? await PasswordHelper.hash(dto.password)
      : existingUser.password;
    return this.prisma.users.update({
      where: { id },
      data: { ...dto, password },
      select: this.USER_SELECT_FIELDS,
    });
  }

  async updateUserPhotoProfile(id: number, urlPath: string) {
    return this.prisma.users.update({
      where: { id },
      data: { photo_profile: urlPath },
      select: { id: true, username: true, photo_profile: true },
    });
  }

  async remove(id: number): Promise<{ message: string }> {
    const user = await this.findUserById(id);
    if (user.photo_profile) {
      const fileKey = this.extractFileKey(user.photo_profile);
      this.storage.delete(fileKey).catch(console.error);
    }
    await this.prisma.users.delete({ where: { id } });
    return { message: `Pengguna ${id} dihapus` };
  }

  private extractFileKey(url: string) {
    const parts = url.split('/uploads/');
    return parts[1] ?? '';
  }

  private async findUserById(id: number) {
    const user = await this.prisma.users.findUnique({ where: { id } });
    if (!user)
      this.throwNotFound('Pengguna tidak ditemukan', 'ID tidak ditemukan');
    return user;
  }

  private async validateUniqueFields(email: string, username: string) {
    const [emailExists, usernameExists] = await Promise.all([
      this.prisma.users.findUnique({ where: { email } }),
      this.prisma.users.findUnique({ where: { username } }),
    ]);

    if (emailExists || usernameExists) {
      const errors: Record<string, string> = {};

      if (emailExists) {
        errors.email = 'Email sudah digunakan';
      }

      if (usernameExists) {
        errors.username = 'Username sudah digunakan';
      }

      throw new HttpException(
        {
          message: 'Validasi gagal',
          errors,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  private async validateUniqueFieldsForUpdate(
    dto: UpdateUserDto,
    existingUser: { email: string; username: string; password: string },
  ) {
    type UserPromise = ReturnType<typeof this.prisma.users.findUnique>;
    const checks: UserPromise[] = [];

    if (dto.email && dto.email !== existingUser.email) {
      checks.push(
        this.prisma.users.findUnique({ where: { email: dto.email } }),
      );
    }

    if (dto.username && dto.username !== existingUser.username) {
      checks.push(
        this.prisma.users.findUnique({ where: { username: dto.username } }),
      );
    }

    if (checks.length === 0) return;

    const results = await Promise.all(checks);
    const errors: Record<string, string> = {};

    // Check which specific field caused the conflict
    let index = 0;
    if (dto.email && dto.email !== existingUser.email) {
      if (results[index]) {
        errors.email = 'Email sudah digunakan';
      }
      index++;
    }

    if (dto.username && dto.username !== existingUser.username) {
      if (results[index]) {
        errors.username = 'Username sudah digunakan';
      }
    }

    if (Object.keys(errors).length > 0) {
      throw new HttpException(
        {
          message: 'Validasi gagal',
          errors,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  private throwNotFound(msg: string, detail: string): never {
    throw new HttpException({ message: msg, errors: { user: detail } }, 404);
  }
}
