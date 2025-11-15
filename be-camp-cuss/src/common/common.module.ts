import { Global, Module } from '@nestjs/common';
import { ValidationHelper } from './helpers/validation.helper';
import { TokenStoreHelper } from './helpers/token-store.helper';
import { RedisLocationModule } from './redis/redis-location.module';

@Global()
@Module({
  imports: [RedisLocationModule],
  providers: [ValidationHelper, TokenStoreHelper],
  exports: [ValidationHelper, TokenStoreHelper],
})
export class CommonModule {}
