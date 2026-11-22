import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ChaptersService } from './chapters.service';
import { AssembleChapterFromScenesDto } from './dto/assemble-chapter-from-scenes.dto';
import { CreateChapterDto } from './dto/create-chapter.dto';
import { CreateChapterVersionDto } from './dto/create-chapter-version.dto';
import { ReorderChaptersDto } from './dto/reorder-chapters.dto';
import { UpdateChapterDto } from './dto/update-chapter.dto';
import { UpdateChapterVersionDto } from './dto/update-chapter-version.dto';

@Controller('projects/:projectId')
export class ChaptersController {
  constructor(private readonly chapters: ChaptersService) {}

  @Get('chapters')
  listChapters(@Param('projectId') projectId: string) {
    return this.chapters.listChapters(projectId);
  }

  @Post('chapters')
  createChapter(@Param('projectId') projectId: string, @Body() dto: CreateChapterDto) {
    return this.chapters.createChapter(projectId, dto);
  }

  @Post('chapters/reorder')
  reorderChapters(@Param('projectId') projectId: string, @Body() dto: ReorderChaptersDto) {
    return this.chapters.reorderChapters(projectId, dto);
  }

  @Get('chapters/:chapterId/profile')
  getProfile(@Param('projectId') projectId: string, @Param('chapterId') chapterId: string) {
    return this.chapters.getProfile(projectId, chapterId);
  }

  @Get('chapters/:chapterId/versions')
  listVersions(@Param('projectId') projectId: string, @Param('chapterId') chapterId: string) {
    return this.chapters.listVersions(projectId, chapterId);
  }

  @Post('chapters/:chapterId/versions')
  createVersion(@Param('projectId') projectId: string, @Param('chapterId') chapterId: string, @Body() dto: CreateChapterVersionDto) {
    return this.chapters.createVersion(projectId, chapterId, dto);
  }

  @Post('chapters/:chapterId/versions/:versionId/activate')
  activateVersion(@Param('projectId') projectId: string, @Param('chapterId') chapterId: string, @Param('versionId') versionId: string) {
    return this.chapters.activateVersion(projectId, chapterId, versionId);
  }

  @Post('chapters/:chapterId/assemble-from-scenes')
  assembleFromScenes(@Param('projectId') projectId: string, @Param('chapterId') chapterId: string, @Body() dto: AssembleChapterFromScenesDto) {
    return this.chapters.assembleFromScenes(projectId, chapterId, dto);
  }

  @Get('chapters/:chapterId')
  getChapter(@Param('projectId') projectId: string, @Param('chapterId') chapterId: string) {
    return this.chapters.getChapter(projectId, chapterId);
  }

  @Patch('chapters/:chapterId')
  updateChapter(@Param('projectId') projectId: string, @Param('chapterId') chapterId: string, @Body() dto: UpdateChapterDto) {
    return this.chapters.updateChapter(projectId, chapterId, dto);
  }

  @Delete('chapters/:chapterId')
  deleteChapter(@Param('projectId') projectId: string, @Param('chapterId') chapterId: string) {
    return this.chapters.deleteChapter(projectId, chapterId);
  }

  @Get('chapter-versions/:versionId')
  getVersion(@Param('projectId') projectId: string, @Param('versionId') versionId: string) {
    return this.chapters.getVersion(projectId, versionId);
  }

  @Patch('chapter-versions/:versionId')
  updateVersion(@Param('projectId') projectId: string, @Param('versionId') versionId: string, @Body() dto: UpdateChapterVersionDto) {
    return this.chapters.updateVersion(projectId, versionId, dto);
  }
}
