import { Global, Module } from '@nestjs/common';
import { ValidationHelper } from './helpers/validation.helper';
import { TokenStoreHelper } from './helpers/token-store.helper';
import { RedisModule } from './redis';
import { JwtStrategy } from './strategies/jwt.strategy';

@Global()
@Module({
  imports: [RedisModule],
  providers: [ValidationHelper, TokenStoreHelper, JwtStrategy],
  exports: [ValidationHelper, TokenStoreHelper, RedisModule],
})
export class CommonModule {}
