import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.services';
import { StoragesService } from '../../storages/storages.service';

@Injectable()
export class UsersUploadService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StoragesService,
  ) {}

  async updateUserFile(
    userId: number,
    field: keyof {
      photo_profile: string;
      photo_id_card: string;
      photo_student_card: string;
      photo_driving_license: string;
    },
    file: Express.Multer.File,
    folder: string,
    isPrivate = false,
  ) {
    if (!file)
      throw new HttpException('File wajib diunggah', HttpStatus.BAD_REQUEST);

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user)
      throw new HttpException('Pengguna tidak ditemukan', HttpStatus.NOT_FOUND);

    // Hapus file lama jika ada
    const oldKey = user[field];
    if (oldKey) {
      await this.storage.delete(oldKey, isPrivate).catch(() => null);
    }

    // Upload file baru
    const uploaded = await this.storage.upload(file, folder, isPrivate);

    // Update di database
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { [field]: uploaded.key },
      select: { id: true, username: true, [field]: true },
    });

    return {
      message: `Upload ${field} berhasil`,
      data: updatedUser,
    };
  }

  async deleteAllUserFiles(userId: number) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user)
      throw new HttpException('Pengguna tidak ditemukan', HttpStatus.NOT_FOUND);

    const deletions: Promise<void>[] = [];

    if (user.photo_profile)
      deletions.push(this.storage.delete(user.photo_profile, false));
    if (user.photo_id_card)
      deletions.push(this.storage.delete(user.photo_id_card, true));
    if (user.photo_student_card)
      deletions.push(this.storage.delete(user.photo_student_card, true));
    if (user.photo_driving_license)
      deletions.push(this.storage.delete(user.photo_driving_license, true));

    await Promise.allSettled(deletions);
    return { message: 'Semua file pengguna berhasil dihapus' };
  }
}
