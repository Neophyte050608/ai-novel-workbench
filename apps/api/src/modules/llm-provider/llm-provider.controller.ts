import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { CreateLlmProviderDto } from './dto/create-llm-provider.dto';
import { MagpieModelsDto } from './dto/magpie-models.dto';
import { TestMagpieConnectionDto } from './dto/test-magpie-connection.dto';
import { UpdateLlmProviderDto } from './dto/update-llm-provider.dto';
import { LlmProviderService } from './llm-provider.service';

@Controller('llm-providers')
export class LlmProviderController {
  constructor(private readonly llmProviders: LlmProviderService) {}

  @Get('magpie/discover')
  discoverMagpie() {
    return this.llmProviders.discoverMagpie();
  }

  @Post('magpie/models')
  listMagpieModels(@Body() dto: MagpieModelsDto) {
    return this.llmProviders.listMagpieModels(dto);
  }

  @Post('magpie/test')
  testMagpieConnection(@Body() dto: TestMagpieConnectionDto) {
    return this.llmProviders.testMagpieConnection(dto);
  }

  @Get()
  list() {
    return this.llmProviders.list();
  }

  @Post()
  create(@Body() dto: CreateLlmProviderDto) {
    return this.llmProviders.create(dto);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.llmProviders.get(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateLlmProviderDto) {
    return this.llmProviders.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.llmProviders.remove(id);
  }

  @Post(':id/set-default')
  setDefault(@Param('id') id: string) {
    return this.llmProviders.setDefault(id);
  }

  @Post(':id/test')
  testProvider(@Param('id') id: string) {
    return this.llmProviders.testProvider(id);
  }
}
