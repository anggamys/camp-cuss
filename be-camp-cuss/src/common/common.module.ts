import { Global, Module } from '@nestjs/common';
import { ValidationHelper } from './helpers/validation.helper';
import { TokenStoreHelper } from './helpers/token-store.helper';

@Global()
@Module({
  providers: [ValidationHelper, TokenStoreHelper],
  exports: [ValidationHelper, TokenStoreHelper],
})
export class CommonModule {}
