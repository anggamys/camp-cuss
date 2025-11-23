/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unused-vars */

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';

import { CreateUserDto } from '../src/users/dto/create-user.dto';
import { UsersService } from '../src/users/services/users.service';

import { CreateDriverRequest } from '../src/users/dto/create-driver-request.dto';
import { UsersDriverRequestService } from '../src/users/services/users-driver-request.service';

import { CreateDestinationDto } from '../src/destinations/dto/create-destination.dto';
import { DestinationsService } from '../src/destinations/destinations.service';

import { CreateOrderDto } from '../src/orders/dto/create-order.dto';
import { OrdersCoreService } from '../src/orders/services/orders-core.service';

import { AppLoggerService } from '../src/common/loggers/app-logger.service';

import * as path from 'path';
import { StoragesService } from '../src/storages/storages.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const usersService = app.get(UsersService);
  const usersDriverRequestService = app.get(UsersDriverRequestService);
  const destinationsService = app.get(DestinationsService);
  const ordersService = app.get(OrdersCoreService);
  const storagesService = app.get(StoragesService);
  const logger = app.get(AppLoggerService);
  const loggerName = 'Seeder';

  try {
    await ordersService['prisma'].order.deleteMany();
    await usersService['prisma'].user.deleteMany();
    await destinationsService['prisma'].destination.deleteMany();

    logger.log('Semua data berhasil dihapus.', loggerName);

    // Daftar user untuk seed
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
        photo_driving_license:
          'users/licenses/1763892353857-c74d61b9-e42d-4ead-b4a6-b2044fcfe145.jpeg',
        photo_profile:
          'users/avatar/1763892354705-b31c027e-9894-45dc-a959-1a3b5660da77.jpeg',
        photo_id_card:
          'users/id-cards/1763892355000-01595c3e-d3e2-4f0b-a8cd-dac58277253f.jpeg',
        photo_student_card:
          'users/student-cards/1763892355306-f9a445f0-6614-446c-8172-b114a9d079fb.jpeg',
      },
      {
        username: 'customer02',
        email: 'customer02@campcuss.test',
        npm: '1903003',
        no_phone: '+628444444444',
        password: 'Customer#124',
        role: 'customer',
        photo_driving_license:
          'users/licenses/1763892353857-c74d61b9-e42d-4ead-b4a6-b2044fcfe145.jpeg',
        photo_profile:
          'users/avatar/1763892354705-b31c027e-9894-45dc-a959-1a3b5660da77.jpeg',
        photo_id_card:
          'users/id-cards/1763892355000-01595c3e-d3e2-4f0b-a8cd-dac58277253f.jpeg',
        photo_student_card:
          'users/student-cards/1763892355306-f9a445f0-6614-446c-8172-b114a9d079fb.jpeg',
      },
    ];

    const createdUsers: any[] = [];
    for (const userData of seedUsers) {
      const created = await usersService.create(userData as CreateUserDto);

      createdUsers.push(created);
      logger.log(`User ${created.username} berhasil dibuat`, loggerName);
    }

    // Ambil ID sesuai role
    const admin = createdUsers.find((u) => u.role === 'admin');
    const customer = createdUsers.find((u) => u.username === 'customer01');
    const driver01 = createdUsers.find((u) => u.username === 'driver01');
    const customer02 = createdUsers.find((u) => u.username === 'customer02');

    // Destinasi
    const seedDestinations: Partial<
      CreateDestinationDto & { imageFile: string }
    >[] = [
      {
        name: 'Fakultas Ilmu Komputer',
        estimated: 15,
        imageFile:
          'destinations/1762219317083-7f86218c-d63a-46b0-827e-627f0a2b084a.png',
      },
      {
        name: 'Gedung Rektorat',
        estimated: 15,
        imageFile:
          'destinations/1762219318211-09cc8497-41ec-4eb3-8fce-f421f48f2fab.jpg',
      },
      {
        name: 'Fakultas Kedokteran',
        estimated: 15,
        imageFile:
          'destinations/1762219318479-d7787756-7ea6-4ec3-bd02-8ac48c729a89.jpg',
      },
      {
        name: 'Perpustakaan Pusat',
        estimated: 10,
        imageFile:
          'destinations/1762219318860-c4e965c4-5078-458c-8236-5518b1a6f320.jpg',
      },
    ];

    const createdDestinations: any[] = [];
    for (const dest of seedDestinations) {
      const created = await destinationsService.create({
        name: dest.name!,
        estimated: dest.estimated!,
        image_place: dest.imageFile!,
      });
      createdDestinations.push(created);
      logger.log(`Destination ${created.name} berhasil dibuat`, loggerName);
    }

    // Driver request
    const driverRequest = await usersDriverRequestService.createDriverRequest(
      customer02.id,
      {
        user_notes: 'Saya ingin menjadi driver karena saya suka mengemudi.',
      } as CreateDriverRequest,
    );
    logger.log(
      `Driver request untuk ${customer02.username} berhasil dibuat`,
      loggerName,
    );

    // Order dummy
    const order = await ordersService.create(customer.id, {
      destination_id: createdDestinations[1].id,
      pick_up_location: 'Jl. Teknik Informatika No. 10',
      pick_up_latitude: -7.290293,
      pick_up_longitude: 112.792812,
    } as CreateOrderDto);
    logger.log(`Order untuk ${customer.username} berhasil dibuat`, loggerName);

    logger.log('Seeding selesai.', loggerName);
  } catch (error) {
    logger.error(
      'Gagal menjalankan seeder:',
      error instanceof Error ? error.message : String(error),
      loggerName,
    );
  } finally {
    await app.close();
  }
}

void bootstrap();
