# Migration 0001: establish-domain-boundaries

## 背景

项目需要先建立 AI 小说创作系统的长期领域边界，避免为了 MVP 过度轻实现，导致后续扩展时持续兼容早期不完整结构。

## 变更内容

新增模型：

- Volume
- ChapterPlan
- ChapterSummary
- Fact
- CharacterState
- Relationship
- PromptRender
- LLMProvider
- GenerationTaskAttempt
- KnowledgeChunk

新增 enum：

- CanonStatus
- FactType
- AttemptStatus

修改模型：

- Project 增加 volumes、chapterPlans、facts、relationships、llmProviders、knowledgeChunks 等关系。
- Chapter 增加 volumeId、plans、summaries、characterStates 等关系。
- Character 增加 canonStatus 和 states。
- WorldItem 增加 canonStatus，并扩展 WorldItemType。
- ContextSnapshot 增加 builderVersion、tokenEstimate、sourceRefs。
- GenerationTask 增加 providerId、resultVersionId、tokenUsage、model、temperature、attempts、promptRender。
- ChapterVersion 增加 generationTaskId 关联。

## 数据迁移策略

当前项目尚处于骨架阶段，无生产数据。执行 Prisma Migrate 即可。

如果未来已有数据：

1. 先创建新表和 nullable 字段。
2. 后续通过 backfill 逐步补 ChapterSummary、CharacterState、Fact。
3. 再按需要收紧约束。

## 回滚策略

开发阶段可通过 Prisma migrate reset 回滚。
生产阶段不直接 drop 表，应新增反向 migration 或保留表并停用相关功能。

## 风险

- schema 边界变多，早期开发会稍重。
- PromptRender 与 GenerationTask 是一对一关系，需要注意 unique 约束。
- ChapterVersion 与 GenerationTask 的结果关系需要在实现时保持一致。

## 验证方式

- [ ] `pnpm db:generate`
- [ ] `pnpm db:migrate --name establish_domain_boundaries`
- [ ] Prisma schema 可解析
- [ ] 相关类型检查通过
