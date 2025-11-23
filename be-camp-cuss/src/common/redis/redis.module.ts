import { Global, Module } from '@nestjs/common';
import { RedisProvider } from './redis.provider';
import { RedisBaseService } from './redis-base.service';
import { RedisLocationService } from './redis-location.service';
import { RedisCacheService } from './redis-cache.service';
import { LoggerModule } from '../loggers/logger.module';

@Global()
@Module({
  imports: [LoggerModule],
  providers: [
    ...RedisProvider,
    RedisBaseService,
    RedisLocationService,
    RedisCacheService,
  ],
  exports: [
    ...RedisProvider,
    RedisBaseService,
    RedisLocationService,
    RedisCacheService,
  ],
})
export class RedisModule {}
