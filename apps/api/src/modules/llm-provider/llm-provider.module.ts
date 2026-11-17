import { Module } from '@nestjs/common';
import { MagpieAdapter } from './adapters/magpie.adapter';
import { MockAdapter } from './adapters/mock.adapter';
import { LlmProviderController } from './llm-provider.controller';
import { LlmProviderService } from './llm-provider.service';

@Module({
  controllers: [LlmProviderController],
  providers: [LlmProviderService, MagpieAdapter, MockAdapter],
  exports: [LlmProviderService, MagpieAdapter, MockAdapter],
})
export class LlmProviderModule {}
