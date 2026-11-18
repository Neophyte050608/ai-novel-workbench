import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';
import { WorldItemsController } from './world-items.controller';
import { WorldItemsService } from './world-items.service';

@Module({
  imports: [PrismaModule],
  controllers: [WorldItemsController],
  providers: [WorldItemsService],
  exports: [WorldItemsService],
})
export class WorldItemsModule {}
