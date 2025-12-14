import { Injectable } from '@nestjs/common';
import { AppLoggerService } from '../../common/loggers/app-logger.service';

@Injectable()
export class StorageImageService {
  private readonly context = StorageImageService.name;
  constructor(private readonly logger: AppLoggerService) {}

  async compressImage(file: Express.Multer.File): Promise<Buffer> {
    try {
      const sharp = (await import('sharp')).default;
      const instance = sharp(file.buffer).resize({
        width: 1280,
        withoutEnlargement: true,
      });
      const buffer =
        file.mimetype === 'image/png'
          ? await instance.png({ quality: 80 }).toBuffer()
          : await instance.jpeg({ quality: 80 }).toBuffer();
      this.logger.debug(`Image compressed: ${file.originalname}`, this.context);
      return buffer;
    } catch (err) {
      this.logger.warn(
        `Compression failed for ${file.originalname}: ${err}`,
        this.context,
      );
      return file.buffer;
    }
  }
}
