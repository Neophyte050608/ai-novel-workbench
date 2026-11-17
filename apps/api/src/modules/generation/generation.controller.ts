import { Controller, Get } from '@nestjs/common';
import { GenerationService } from './generation.service';

@Controller('generation-tasks')
export class GenerationController {
  constructor(private readonly generation: GenerationService) {}

  @Get('placeholder')
  placeholder() {
    return this.generation.createPlaceholderTask();
  }
}
