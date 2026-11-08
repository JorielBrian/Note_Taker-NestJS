import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post } from '@nestjs/common';
import { CurrentUserId } from '../auth/current-user.decorator';
import { UuidParam } from '../common/uuid-param.pipe';
import { NotebookNameDto } from './dto/notebook.dto';
import { NotebooksService } from './notebooks.service';

@Controller('notebooks')
export class NotebooksController {
  constructor(private readonly notebooks: NotebooksService) {}

  @Get()
  list(@CurrentUserId() userId: string) {
    return this.notebooks.list(userId);
  }

  @Post()
  create(@CurrentUserId() userId: string, @Body() dto: NotebookNameDto) {
    return this.notebooks.create(userId, dto.name);
  }

  @Patch(':id')
  rename(
    @CurrentUserId() userId: string,
    @Param('id', UuidParam()) id: string,
    @Body() dto: NotebookNameDto,
  ) {
    return this.notebooks.rename(userId, id, dto.name);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@CurrentUserId() userId: string, @Param('id', UuidParam()) id: string) {
    return this.notebooks.remove(userId, id);
  }
}
