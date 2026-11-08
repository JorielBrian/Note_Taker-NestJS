import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export const MAX_CONTENT_LENGTH = 100_000;

export class CreateNoteDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(MAX_CONTENT_LENGTH)
  content?: string;
}

export class UpdateNoteDto extends CreateNoteDto {
  /** Moving a note to another notebook (must belong to the same user). */
  @IsOptional()
  @IsUUID()
  notebookId?: string;
}
