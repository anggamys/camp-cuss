import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.services';
import { StoragesService } from '../../storages/storages.service';
import { AppLoggerService } from '../../common/loggers/app-logger.service';

@Injectable()
export class UsersUploadService {
  private readonly context = UsersUploadService.name;

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StoragesService,
    private readonly logger: AppLoggerService,
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
    if (!file) {
      this.logger.warn('File wajib diunggah pada updateUserFile', this.context);
      throw new HttpException('File wajib diunggah', HttpStatus.BAD_REQUEST);
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      this.logger.warn(
        `User not found for updateUserFile (userId: ${userId})`,
        this.context,
      );
      throw new HttpException('Pengguna tidak ditemukan', HttpStatus.NOT_FOUND);
    }

    // Hapus file lama jika ada
    const oldKey = user[field];
    if (oldKey) {
      await this.storage
        .delete(oldKey, isPrivate)
        .then(() => {
          this.logger.debug(
            `Old file deleted for userId: ${userId}, field: ${field}`,
            this.context,
          );
        })
        .catch((err) => {
          this.logger.warn(
            `Failed to delete old file for userId: ${userId}, field: ${field} - ${err instanceof Error ? err.message : err}`,
            this.context,
          );
        });
    }

    // Upload file baru
    let uploaded: { key: string };
    try {
      uploaded = (await this.storage.upload(file, folder, isPrivate)) as {
        key: string;
      };
      this.logger.log(
        `File uploaded for userId: ${userId}, field: ${field}, key: ${uploaded.key}`,
        this.context,
      );
    } catch (error) {
      this.logger.error(
        `Failed to upload file for userId: ${userId}, field: ${field} - ${error instanceof Error ? error.message : error}`,
        this.context,
      );
      throw error;
    }

    // Update di database
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { [field]: uploaded.key },
      select: { id: true, username: true, [field]: true },
    });
    this.logger.log(
      `User updated with new file for userId: ${userId}, field: ${field}`,
      this.context,
    );

    return {
      message: `Upload ${field} berhasil`,
      data: updatedUser,
    };
  }

  async deleteAllUserFiles(userId: number) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      this.logger.warn(
        `User not found for deleteAllUserFiles (userId: ${userId})`,
        this.context,
      );
      throw new HttpException('Pengguna tidak ditemukan', HttpStatus.NOT_FOUND);
    }

    const deletions: Promise<void>[] = [];

    if (user.photo_profile)
      deletions.push(this.storage.delete(user.photo_profile, false));
    if (user.photo_id_card)
      deletions.push(this.storage.delete(user.photo_id_card, true));
    if (user.photo_student_card)
      deletions.push(this.storage.delete(user.photo_student_card, true));
    if (user.photo_driving_license)
      deletions.push(this.storage.delete(user.photo_driving_license, true));

    const results = await Promise.allSettled(deletions);
    const failed = results.filter((r) => r.status === 'rejected');
    if (failed.length > 0) {
      this.logger.warn(
        `Some files failed to delete for userId: ${userId} (${failed.length} failures)`,
        this.context,
      );
    } else {
      this.logger.log(
        `All user files deleted for userId: ${userId}`,
        this.context,
      );
    }
    return { message: 'Semua file pengguna berhasil dihapus' };
  }
}
