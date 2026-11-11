import { ParseUUIDPipe } from '@nestjs/common';

// Malformed ids answer 404 like unknown ids, so the API reveals nothing about what exists.
export const UuidParam = () => new ParseUUIDPipe({ errorHttpStatusCode: 404 });
