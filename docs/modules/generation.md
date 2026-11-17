# Generation 模块

## 职责

管理 AI 生成任务，包括生成章节、续写、改写、润色、任务状态和失败重试。

## 不负责

- 不直接拼 Prompt。
- 不直接查询复杂上下文。
- 不直接调用具体模型 SDK。
- 不直接覆盖章节正文。

## 依赖

- Context Builder
- Prompts
- LLM Provider
- Chapters
