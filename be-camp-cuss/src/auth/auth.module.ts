import { Global, Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtEnvKeys } from '../common/enums/env-keys.enum';

@Global()
@Module({
  imports: [
    PrismaModule,
    ConfigModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService): JwtModuleOptions => {
        const secret = config.get<string>(JwtEnvKeys.JWT_ACCESS_SECRET);
        const expiresRaw = config.get<string>(JwtEnvKeys.JWT_ACCESS_EXPIRES);
        const expiresIn = Number(expiresRaw);

        if (!secret) {
          throw new Error('Missing environment variable: JWT_ACCESS_SECRET');
        }

        if (Number.isNaN(expiresIn) || expiresIn <= 0) {
          throw new Error(
            `Invalid value for JWT_ACCESS_EXPIRES: "${expiresRaw}" — must be a positive number in seconds.`,
          );
        }

        return {
          secret,
          signOptions: { expiresIn },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
