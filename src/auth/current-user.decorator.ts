import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { AuthedRequest } from '../common/types';

export const CurrentUserId = createParamDecorator((_: unknown, ctx: ExecutionContext): string => {
  return ctx.switchToHttp().getRequest<AuthedRequest>().user.id;
});
