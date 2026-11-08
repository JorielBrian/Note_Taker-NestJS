import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post } from '@nestjs/common';
import { CurrentUserId } from '../auth/current-user.decorator';
import { UuidParam } from '../common/uuid-param.pipe';
import { CreateNoteDto, UpdateNoteDto } from './dto/note.dto';
import { NotesService } from './notes.service';

@Controller()
export class NotesController {
  constructor(private readonly notes: NotesService) {}

  @Get('notebooks/:notebookId/notes')
  list(@CurrentUserId() userId: string, @Param('notebookId', UuidParam()) notebookId: string) {
    return this.notes.listInNotebook(userId, notebookId);
  }

  @Post('notebooks/:notebookId/notes')
  create(
    @CurrentUserId() userId: string,
    @Param('notebookId', UuidParam()) notebookId: string,
    @Body() dto: CreateNoteDto,
  ) {
    return this.notes.create(userId, notebookId, dto);
  }

  @Get('notes/:id')
  get(@CurrentUserId() userId: string, @Param('id', UuidParam()) id: string) {
    return this.notes.get(userId, id);
  }

  @Patch('notes/:id')
  update(
    @CurrentUserId() userId: string,
    @Param('id', UuidParam()) id: string,
    @Body() dto: UpdateNoteDto,
  ) {
    return this.notes.update(userId, id, dto);
  }

  @Delete('notes/:id')
  @HttpCode(204)
  remove(@CurrentUserId() userId: string, @Param('id', UuidParam()) id: string) {
    return this.notes.remove(userId, id);
  }
}
