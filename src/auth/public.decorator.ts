import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC = 'isPublic';
/** Routes are protected by default (deny-by-default); mark exceptions with @Public(). */
export const Public = () => SetMetadata(IS_PUBLIC, true);
