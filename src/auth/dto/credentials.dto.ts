import { Transform } from 'class-transformer';
import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

const normaliseUsername = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim().toLowerCase() : value;

export class RegisterDto {
  @Transform(normaliseUsername)
  @IsString()
  @Matches(/^[a-z0-9_]{3,30}$/, {
    message: 'username must be 3-30 characters: letters, numbers or underscores',
  })
  username!: string;

  @IsString()
  @MinLength(8, { message: 'password must be at least 8 characters' })
  @MaxLength(128)
  password!: string;
}

export class LoginDto {
  @Transform(normaliseUsername)
  @IsString()
  @MinLength(1)
  @MaxLength(30)
  username!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(128)
  password!: string;
}