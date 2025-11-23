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

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const usersService = app.get(UsersService);
  const usersDriverRequestService = app.get(UsersDriverRequestService);
  const destinationsService = app.get(DestinationsService);
  const ordersService = app.get(OrdersCoreService);
  const logger = app.get(AppLoggerService);
  const loggerName = 'Seeder';

  try {
    await destinationsService['prisma'].destination.deleteMany();
    await usersService['prisma'].user.deleteMany();
    logger.log('Semua data berhasil dihapus.', loggerName);

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
        photo_driving_license: 'dummyStorage/driving_license_sample.jpg',
        photo_profile: 'dummyStorage/driver01_profile.png',
        photo_id_card: 'dummyStorage/driver01_id_card.png',
        photo_student_card: 'dummyStorage/driver01_student_card.png',
      },
      {
        username: 'driver02',
        email: 'driver02@campcuss.test',
        npm: 'DR-0002',
        no_phone: '+628444444444',
        password: 'Driver#124',
        role: 'customer',
        photo_driving_license: 'dummyStorage/driving_license_sample.jpg',
        photo_profile: 'dummyStorage/driver02_profile.png',
        photo_id_card: 'dummyStorage/driver02_id_card.png',
        photo_student_card: 'dummyStorage/driver02_student_card.png',
      },
    ];

    const createdUsers: any[] = [];
    for (const user of seedUsers) {
      const created = await usersService.create(user as CreateUserDto);
      createdUsers.push(created);
      logger.log(`User ${created.username} berhasil dibuat`, loggerName);
    }

    // Ambil ID spesifik berdasarkan role
    const admin = createdUsers.find((u) => u.role === 'admin');
    const customer = createdUsers.find((u) => u.username === 'customer01');
    const driver01 = createdUsers.find((u) => u.username === 'driver01');
    const driver02 = createdUsers.find((u) => u.username === 'driver02');

    const seedDestinations: Partial<
      CreateDestinationDto & { imageFile: string }
    >[] = [
      {
        name: 'Fakultas Ilmu Komputer',
        estimated: 15,
        imageFile: 'dummyStorage/fasilkom.png',
      },
      {
        name: 'Gedung Rektorat',
        estimated: 15,
        imageFile: 'dummyStorage/Rektorat_UPN_Jatim.jpg',
      },
      {
        name: 'Fakultas Kedokteran',
        estimated: 15,
        imageFile: 'dummyStorage/fk.jpg',
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

    const driverRequest = await usersDriverRequestService.createDriverRequest(
      driver02.id, // gunakan ID hasil create()
      {
        user_notes: 'Saya ingin menjadi driver karena saya suka mengemudi.',
      } as CreateDriverRequest,
    );
    logger.log(
      `Driver request untuk ${driver02.username} berhasil dibuat`,
      loggerName,
    );

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
