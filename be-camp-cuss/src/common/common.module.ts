import { Global, Module } from '@nestjs/common';
import { ValidationHelper } from './helpers/validation.helper';
import { TokenStoreHelper } from './helpers/token-store.helper';
import { RedisModule } from './redis';

@Global()
@Module({
  imports: [RedisModule],
  providers: [ValidationHelper, TokenStoreHelper],
  exports: [ValidationHelper, TokenStoreHelper, RedisModule],
})
export class CommonModule {}
