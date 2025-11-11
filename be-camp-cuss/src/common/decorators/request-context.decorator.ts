import { createParamDecorator } from '@nestjs/common';
import { RequestContextService } from '../contexts/request-context.service';
import { RequestContextData } from '../types/request-context.interface';

export const RequestContext = createParamDecorator(
  (data: keyof RequestContextData | undefined) => {
    const all = RequestContextService.getAll();
    if (!data) return all;
    if (all && typeof data === 'string') {
      return all[data];
    }
    return undefined;
  },
);
