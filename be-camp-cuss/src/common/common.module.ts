import { Global, Module } from '@nestjs/common';
import { PrismaHelper } from './helpers/prisma.helper';
import { TokenStoreHelper } from './helpers/token-store.helper';
import { RedisModule } from './redis';
import { JwtStrategy } from './strategies/jwt.strategy';

@Global()
@Module({
  imports: [RedisModule],
  providers: [PrismaHelper, TokenStoreHelper, JwtStrategy],
  exports: [PrismaHelper, TokenStoreHelper, RedisModule],
})
export class CommonModule {}
