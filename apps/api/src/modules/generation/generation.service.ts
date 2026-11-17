import { Injectable } from '@nestjs/common';

@Injectable()
export class GenerationService {
  // TODO: 编排 Context Builder -> Prompt Renderer -> LLM Provider -> ChapterVersion。
  createPlaceholderTask() {
    return { status: 'planned', message: 'Generation pipeline placeholder' };
  }
}
