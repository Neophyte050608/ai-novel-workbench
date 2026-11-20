import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ChaptersService } from './chapters.service';
import { CreateChapterDto } from './dto/create-chapter.dto';
import { ReorderChaptersDto } from './dto/reorder-chapters.dto';
import { UpdateChapterDto } from './dto/update-chapter.dto';

@Controller('projects/:projectId/chapters')
export class ChaptersController {
  constructor(private readonly chapters: ChaptersService) {}

  @Get()
  listChapters(@Param('projectId') projectId: string) {
    return this.chapters.listChapters(projectId);
  }

  @Post()
  createChapter(@Param('projectId') projectId: string, @Body() dto: CreateChapterDto) {
    return this.chapters.createChapter(projectId, dto);
  }

  @Post('reorder')
  reorderChapters(@Param('projectId') projectId: string, @Body() dto: ReorderChaptersDto) {
    return this.chapters.reorderChapters(projectId, dto);
  }

  @Get(':chapterId')
  getChapter(@Param('projectId') projectId: string, @Param('chapterId') chapterId: string) {
    return this.chapters.getChapter(projectId, chapterId);
  }

  @Patch(':chapterId')
  updateChapter(@Param('projectId') projectId: string, @Param('chapterId') chapterId: string, @Body() dto: UpdateChapterDto) {
    return this.chapters.updateChapter(projectId, chapterId, dto);
  }

  @Delete(':chapterId')
  deleteChapter(@Param('projectId') projectId: string, @Param('chapterId') chapterId: string) {
    return this.chapters.deleteChapter(projectId, chapterId);
  }
}
