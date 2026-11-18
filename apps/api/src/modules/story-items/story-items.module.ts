import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';
import { StoryItemsController } from './story-items.controller';
import { StoryItemsService } from './story-items.service';

@Module({
  imports: [PrismaModule],
  controllers: [StoryItemsController],
  providers: [StoryItemsService],
  exports: [StoryItemsService],
})
export class StoryItemsModule {}
