import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';
import { WorldRulesController } from './world-rules.controller';
import { WorldRulesService } from './world-rules.service';

@Module({
  imports: [PrismaModule],
  controllers: [WorldRulesController],
  providers: [WorldRulesService],
  exports: [WorldRulesService],
})
export class WorldRulesModule {}
