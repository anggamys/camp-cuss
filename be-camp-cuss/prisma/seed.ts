import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { UsersService } from '../src/users/services/users.service';
import { DestinationsService } from '../src/destinations/destinations.service';
import { StoragesService } from '../src/storages/storages.service';
import { CreateUserDto } from '../src/users/dto/create-user.dto';
import { CreateDestinationDto } from '../src/destinations/dto/create-destination.dto';
import * as fs from 'fs';
import * as path from 'path';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const usersService = app.get(UsersService);
  const destinationsService = app.get(DestinationsService);
  const storagesService = app.get(StoragesService);

  const seedUsers: Partial<CreateUserDto>[] = [
    {
      username: 'admin',
      email: 'admin@campcuss.test',
      npm: '0000001',
      no_phone: '+628111111111',
      password: 'Admin#1234',
      role: 'admin',
    },
    {
      username: 'customer01',
      email: 'customer01@campcuss.test',
      npm: '1903002',
      no_phone: '+628222222222',
      password: 'Customer#123',
      role: 'customer',
    },
    {
      username: 'driver01',
      email: 'driver01@campcuss.test',
      npm: 'DR-0001',
      no_phone: '+628333333333',
      password: 'Driver#123',
      role: 'driver',
    },
  ];

  const seedDestinations: Partial<
    CreateDestinationDto & { imageFile: string }
  >[] = [
    {
      name: 'Fakultas Ilmu Komputer',
      estimated: 15,
      imageFile: 'fasilkom.png',
    },
    {
      name: 'Gedung Rektorat',
      estimated: 15,
      imageFile: 'Rektorat_UPN_Jatim.jpg',
    },
    {
      name: 'Fakultas Kedokteran',
      estimated: 15,
      imageFile: 'fk.jpg',
    },
    {
      name: 'Giri Pustaka',
      estimated: 15,
      imageFile: 'giri-pustaka.jpg',
    },
    {
      name: 'Fakultas Ekonomi dan Bisnis',
      estimated: 15,
      imageFile: 'feb.jpeg',
    },
    {
      name: 'Gedung Kuliah Bersama',
      estimated: 15,
      imageFile: 'gkb.jpg',
    },
    {
      name: 'Tekno Park',
      estimated: 15,
      imageFile: 'tekno-park.jpg',
    },
  ];

  try {
    await destinationsService['prisma'].destination.deleteMany();
    await usersService['prisma'].user.deleteMany();
    console.log('Semua data berhasil dihapus.');

    for (const user of seedUsers) {
      await usersService.create(user as CreateUserDto);
      console.log(`User ${user.username} berhasil dibuat`);
    }

    for (const destination of seedDestinations) {
      let imageKey: string | null = null;

      if (destination.imageFile) {
        const filePath = path.join(__dirname, 'assets', destination.imageFile);
        const fileBuffer = fs.readFileSync(filePath);

        // Upload ke Supabase storage
        const uploaded = await storagesService.upload(
          {
            buffer: fileBuffer,
            originalname: destination.imageFile,
            mimetype: 'image/jpeg',
          } as Express.Multer.File,
          'destinations',
          false,
        );

        imageKey = uploaded.key;
      }

      await destinationsService.create({
        name: destination.name!,
        estimated: destination.estimated!,
        image_place: imageKey ?? null,
      });

      console.log(`Destination ${destination.name} berhasil dibuat`);
    }
  } catch (error) {
    console.error('Gagal menjalankan seeder:', error);
  } finally {
    await app.close();
  }
}

void bootstrap();
