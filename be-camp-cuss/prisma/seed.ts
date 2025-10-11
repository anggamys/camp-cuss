import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { UsersService } from '../src/users/users.service';
import { CreateUserDto } from '../src/users/dto/create-user.dto';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const usersService = app.get(UsersService);

  const seedUsers: Partial<CreateUserDto>[] = [
    {
      username: 'admin',
      email: 'admin@campcuss.test',
      npm: '0000001',
      no_phone: '+628111111111',
      password: 'Admin#1234',
      role: 'admin',
      ktm: 'ktm-admin.jpg',
      ktp: 'ktp-admin.jpg',
      sim: 'sim-admin.jpg',
      photo_profile: 'admin-profile.jpg',
    },
    {
      username: 'johndoe',
      email: 'john.doe@example.com',
      npm: '1903002',
      no_phone: '+628222222222',
      password: 'Customer#123',
      role: 'customer',
      ktm: 'ktm-johndoe.jpg',
      ktp: 'ktp-johndoe.jpg',
      sim: 'sim-johndoe.jpg',
      photo_profile: 'john-profile.jpg',
    },
    {
      username: 'driver01',
      email: 'driver01@campcuss.test',
      npm: 'DR-0001',
      no_phone: '+628333333333',
      password: 'Driver#123',
      role: 'driver',
      ktm: 'ktm-driver01.jpg',
      ktp: 'ktp-driver01.jpg',
      sim: 'sim-driver01.jpg',
      photo_profile: 'driver01-profile.jpg',
    },
  ];

  try {
    for (const user of seedUsers) {
      try {
        await usersService.create(user as CreateUserDto);
        console.log(`User ${user.username} berhasil dibuat`);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.log(`User ${user.username} dilewati: ${message}`);
      }
    }
  } catch (error) {
    console.error('Gagal menjalankan seeder:', error);
  } finally {
    await app.close();
  }
}

void bootstrap();
