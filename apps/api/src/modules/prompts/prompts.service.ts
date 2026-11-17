import { Injectable } from '@nestjs/common';

@Injectable()
export class PromptsService {
  // TODO: 管理 PromptTemplate、PromptVersion 和渲染。
  getVersioningRule() {
    return '<domain>.<task>.v<major>.<minor>.<patch>';
  }
}
