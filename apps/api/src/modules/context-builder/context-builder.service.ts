import { Injectable } from '@nestjs/common';

@Injectable()
export class ContextBuilderService {
  // TODO: 从项目、章节、大纲、角色、世界观构建 ContextSnapshot。
  preview() {
    return { status: 'planned', strategy: 'structured-context-first' };
  }
}
