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
    photo_id_card: true,
    photo_student_card: true,
    photo_driving_license: true,
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
      if (!users.length)
        throw new HttpException('Tidak ada pengguna', HttpStatus.NOT_FOUND);
      return users;
    } catch (error) {
      PrismaErrorHelper.handle(error);
    }
  }

  async findOne(id: number): Promise<FindUserResponseDto> {
    try {
      const user = await this.prisma.users.findUnique({
        where: { id },
        select: this.USER_SELECT_FIELDS,
      });
      if (!user)
        this.throwNotFound('Pengguna tidak ditemukan', 'ID tidak ditemukan');

      // Build public & private URLs
      const photoProfileUrl = user.photo_profile
        ? this.storage.buildPublicUrl(user.photo_profile)
        : null;

      const photoIdCardUrl = user.photo_id_card
        ? await this.storage.createSignedUrl(user.photo_id_card)
        : null;

      const photoDrivingLicenseUrl = user.photo_driving_license
        ? await this.storage.createSignedUrl(user.photo_driving_license)
        : null;

      return {
        ...user,
        photo_profile: photoProfileUrl,
        photo_id_card: photoIdCardUrl,
        photo_driving_license: photoDrivingLicenseUrl,
      };
    } catch (error) {
      PrismaErrorHelper.handle(error);
    }
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

  async updateUserPhotoProfile(id: number, fileKey: string) {
    return this.prisma.users.update({
      where: { id },
      data: { photo_profile: fileKey },
      select: { id: true, username: true, photo_profile: true },
    });
  }

  async updatePhotoIdCard(id: number, fileKey: string) {
    return this.prisma.users.update({
      where: { id },
      data: { photo_id_card: fileKey },
      select: { id: true, username: true, photo_id_card: true },
    });
  }

  async updatePhotoStudentCard(id: number, fileKey: string) {
    return this.prisma.users.update({
      where: { id },
      data: { photo_student_card: fileKey },
      select: { id: true, username: true, photo_student_card: true },
    });
  }

  async updatePhotoDrivingLicense(id: number, fileKey: string) {
    return this.prisma.users.update({
      where: { id },
      data: { photo_driving_license: fileKey },
      select: { id: true, username: true, photo_driving_license: true },
    });
  }

  // === Hapus user + semua file terkait ===
  async remove(id: number): Promise<{ message: string }> {
    const user = await this.findUserById(id);

    // Hapus semua file storage (berdasarkan fileKey)
    const deletions: Promise<void>[] = [];

    if (user.photo_profile) {
      deletions.push(this.storage.delete(user.photo_profile, false));
    }

    if (user.photo_id_card) {
      deletions.push(this.storage.delete(user.photo_id_card as string, true));
    }

    if (user.photo_driving_license) {
      deletions.push(
        this.storage.delete(user.photo_driving_license as string, true),
      );
    }

    // Jalankan paralel supaya cepat
    await Promise.allSettled(deletions);

    // Hapus user di DB
    await this.prisma.users.delete({ where: { id } });

    return { message: `Pengguna dengan ID ${id} berhasil dihapus` };
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
      if (emailExists) errors.email = 'Email sudah digunakan';
      if (usernameExists) errors.username = 'Username sudah digunakan';

      throw new HttpException(
        { message: 'Validasi gagal', errors },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  private async validateUniqueFieldsForUpdate(
    dto: UpdateUserDto,
    existingUser: { email: string; username: string; password: string },
  ) {
    const checks: Promise<any>[] = [];

    if (dto.email && dto.email !== existingUser.email)
      checks.push(
        this.prisma.users.findUnique({ where: { email: dto.email } }),
      );

    if (dto.username && dto.username !== existingUser.username)
      checks.push(
        this.prisma.users.findUnique({ where: { username: dto.username } }),
      );

    if (checks.length === 0) return;

    const results = await Promise.all(checks);
    const errors: Record<string, string> = {};

    if (dto.email && dto.email !== existingUser.email && results[0])
      errors.email = 'Email sudah digunakan';

    if (dto.username && dto.username !== existingUser.username && results[1])
      errors.username = 'Username sudah digunakan';

    if (Object.keys(errors).length)
      throw new HttpException(
        { message: 'Validasi gagal', errors },
        HttpStatus.BAD_REQUEST,
      );
  }

  private throwNotFound(message: string, detail: string): never {
    throw new HttpException(
      { message, errors: { user: detail } },
      HttpStatus.NOT_FOUND,
    );
  }
}
