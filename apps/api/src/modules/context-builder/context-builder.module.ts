import { Module } from '@nestjs/common';
import { ContextBuilderController } from './context-builder.controller';
import { ContextBuilderService } from './context-builder.service';

@Module({ controllers: [ContextBuilderController], providers: [ContextBuilderService], exports: [ContextBuilderService] })
export class ContextBuilderModule {}
