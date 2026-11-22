# add_chapter_summary_workflow

## 背景

ChapterSummary P1 需要补齐章节级摘要闭环：人工维护章节摘要，并从已确认 SceneSummary 汇总生成章节摘要。既有 `ChapterSummary` 表已有摘要正文和 JSON 字段，但缺少生命周期、软删除、项目关系外键和来源追溯字段，无法安全支持确认 / 归档 / 恢复 / 软删除和 rollup 来源记录。

本迁移对应 Prisma migration：`apps/api/prisma/migrations/20261122183000_add_chapter_summary_workflow/migration.sql`。

## 变更内容

修改 `ChapterSummary`：

- 新增 `canonStatus CanonStatus @default(draft)`：区分 draft / confirmed / archived。
- 新增 `sourceType String?` 与 `sourceId String?`：记录人工或场景摘要汇总来源。
- 新增 `deletedAt DateTime?`：支持软删除。
- 为既有 `projectId` 增加 `ChapterSummary -> Project` 外键关系。
- 保留 `chapterVersionId String?`，允许摘要可选绑定当前 ChapterVersion。

新增索引：

- `ChapterSummary_projectId_canonStatus_idx`：按项目读取已确认摘要。
- `ChapterSummary_chapterVersionId_idx`：按章节版本查找摘要。
- `ChapterSummary_deletedAt_idx`：过滤软删除记录。

未新增内容：

- 不新增 `MemoryRecord` / `EvidenceRef`。
- 不新增 PromptRender / ContextBuilder / AI 自动总结相关字段。

## 数据迁移策略

1. 历史 `ChapterSummary` 默认 `canonStatus = draft`。
2. 历史 `ChapterSummary.sourceType/sourceId/deletedAt` 为空。
3. migration 通过 `ChapterSummary.chapterId -> Chapter.projectId` 回填 / 校准 `projectId`，再增加 Project 外键约束。
4. 历史摘要不会自动确认，也不会写入小说记忆。

## 回滚策略

如需回滚：

1. 确认业务不再依赖摘要确认状态、软删除和来源追溯。
2. 删除新增索引和 `ChapterSummary_projectId_fkey`。
3. 删除 `canonStatus/sourceType/sourceId/deletedAt` 字段。
4. 回退 Prisma schema 中 `Project.chapterSummaries` 与 `ChapterSummary.project` relation。

注意：回滚会丢失摘要确认 / 归档状态、软删除标记和汇总来源追溯。

## 风险

- `sourceId` 在 P1 使用逗号拼接 SceneSummary id 列表，适合轻量追溯；后续如果需要强关系查询，可新增 join 表而不是复用 MemoryRecord。
- 数据库只能保证 `ChapterSummary.chapterVersionId` 指向存在的 ChapterVersion，不能自动保证该版本属于同 project / chapter；service 层必须校验。
- 历史摘要默认 draft，若需要进入 confirmed，需要用户显式确认。

## 验证方式

计划执行：

```bash
pnpm --filter @ai-novel/api exec prisma format
pnpm --filter @ai-novel/api exec prisma validate
pnpm db:generate
pnpm --filter @ai-novel/api typecheck
pnpm --filter @ai-novel/web typecheck
pnpm --filter @ai-novel/web build
```

验证重点：

- Prisma schema 能格式化并通过校验。
- ChapterSummary 字段、外键和索引与 schema 一致。
- 章节摘要 API 和前端类型检查通过。
- 未新增 MemoryRecord / EvidenceRef / AI 自动总结链路。
