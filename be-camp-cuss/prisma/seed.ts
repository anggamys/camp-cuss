import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { UsersService } from '../src/users/users.service';
import { CreateUserDto } from '../src/users/dto/create-user.dto';
import { CreateDestinationDto } from '../src/destinations/dto/create-destination.dto';
import { DestinationsService } from '../src/destinations/destinations.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const usersService = app.get(UsersService);
  const destinationsService = app.get(DestinationsService);

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

  const seedDestinations: Partial<CreateDestinationDto>[] = [
    {
      name: 'Fakultas Ilmu Komputer',
      latitude: -7.334667,
      longitude: 112.788194,
      estimated: 15,
      image_place: null,
    },
  ];

  try {
    try {
      await destinationsService['prisma'].destinations.deleteMany();
      await usersService['prisma'].users.deleteMany();
      console.log('Semua data berhasil dihapus.');
    } catch (error) {
      console.error('Gagal menghapus data:', error);
    }

    for (const user of seedUsers) {
      try {
        await usersService.create(user as CreateUserDto);
        console.log(`User ${user.username} berhasil dibuat`);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.log(`User ${user.username} dilewati: ${message}`);
      }
    }

    for (const destination of seedDestinations) {
      try {
        await destinationsService.create(destination as CreateDestinationDto);
        console.log(`Destination ${destination.name} berhasil dibuat`);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.log(`Destination ${destination.name} dilewati: ${message}`);
      }
    }
  } catch (error) {
    console.error('Gagal menjalankan seeder:', error);
  } finally {
    await app.close();
  }
}

void bootstrap();
