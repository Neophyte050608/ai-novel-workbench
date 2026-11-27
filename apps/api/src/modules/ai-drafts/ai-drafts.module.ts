import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';
import { ChaptersModule } from '../chapters/chapters.module';
import { ScenesModule } from '../scenes/scenes.module';
import { AiDraftsController } from './ai-drafts.controller';
import { AiDraftsService } from './ai-drafts.service';

@Module({
  imports: [PrismaModule, ChaptersModule, ScenesModule],
  controllers: [AiDraftsController],
  providers: [AiDraftsService],
  exports: [AiDraftsService],
})
export class AiDraftsModule {}
