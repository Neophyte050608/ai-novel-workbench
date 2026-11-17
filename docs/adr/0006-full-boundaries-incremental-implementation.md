# ADR-0006: 保持完整模块边界，分阶段实现功能

## 状态

Accepted

## 背景

项目会使用 AI 参与开发。为了快速推进 MVP，容易出现“轻实现”：把复杂领域先塞进 JSON、临时字段、通用 notes 或单个 Service 中。

这种做法短期看起来快，但会导致后续扩展时必须持续兼容早期不完整抽象，尤其会影响 AI 小说项目中的规划层、小说记忆层、Prompt 渲染、生成任务追溯、模型调用记录等核心链路。

## 决策

我们采用：**完整边界，分阶段实现**。

含义：

- 模块边界按长期架构设计。
- 数据模型按核心关系设计。
- 功能可以逐步补齐。
- UI 可以暂缓。
- 复杂逻辑可以先简单实现。
- 但不允许用临时结构破坏长期可维护性。

## 具体规则

1. Planning、Novel Memory、Prompt Render、LLM Provider、Generation Attempt 等领域应独立建模。
2. MVP 可以只实现基础字段和基础用例，但必须保留未来扩展关系。
3. AI 生成链路必须保持可追溯：
   `GenerationTask -> ContextSnapshot -> PromptVersion/PromptRender -> LLMProvider -> ChapterVersion`。
4. 不允许把章节计划、角色状态、事实台账、生成记录全部塞进无约束 JSON。
5. JSONB 可以用于扩展元数据，但不能替代核心关系。
6. 暂缓模块必须在文档中写清楚未来演进方向。

## 备选方案

### 方案 A：极简 MVP，后续重构

优点：启动快。

缺点：后续兼容成本高，AI 开发容易沿着错误结构继续扩散。

### 方案 B：一次性实现所有成熟模块

优点：结构完整。

缺点：前期工作量过大，容易陷入过度设计。

### 当前方案：完整边界，分阶段实现

优点：兼顾长期可维护性和短期推进速度。

缺点：初期 schema 和文档会稍微重一点。

## 影响范围

- Prisma schema
- 模块文档
- Generation 链路
- Prompt 管理
- Context Builder
- Novel Memory
- 后续 AI 开发约束

## 后续行动

- [ ] 补充 novel-writing-flow 架构文档。
- [ ] 在 Prisma schema 中补齐第一批长期边界模型。
- [ ] 为 Planning、Novel Memory、LLM Provider、Prompts 补模块文档。
