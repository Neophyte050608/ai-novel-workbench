import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';
import { AbilitiesController } from './abilities.controller';
import { AbilitiesService } from './abilities.service';

@Module({
  imports: [PrismaModule],
  controllers: [AbilitiesController],
  providers: [AbilitiesService],
  exports: [AbilitiesService],
})
export class AbilitiesModule {}
