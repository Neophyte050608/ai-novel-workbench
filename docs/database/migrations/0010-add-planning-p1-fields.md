# add_planning_p1_fields

## 背景

Planning P1 要把分卷 / 故事单元与章节计划纳入可编辑工作流。既有 schema 已有 `Volume` 与 `ChapterPlan`，本次不新增 `VolumePlan`，只补齐 ChapterPlan 与 Volume 的轻量关联、状态和索引。

本迁移对应 Prisma migration：`apps/api/prisma/migrations/20261122165311_add_planning_p1_fields/migration.sql`。

## 变更内容

修改 `ChapterPlan`：

- 新增 `volumeId String?`。
- 新增 `status String @default("planned")`。
- 新增 `canonStatus CanonStatus @default(draft)`。
- 新增 `sourceType String?`。
- 新增 `sourceId String?`。
- 新增 `ChapterPlan -> Volume?` relation，删除 Volume 时 `volumeId` 置空。

修改 `Volume`：

- 新增反向 relation：`chapterPlans ChapterPlan[]`。

新增索引：

- `ChapterPlan_projectId_volumeId_orderIndex_idx`：支持按项目 + 分卷读取章节计划。
- `ChapterPlan_projectId_status_idx`：支持按计划工作流状态筛选。
- `ChapterPlan_projectId_canonStatus_idx`：支持后续读取已确认规划资料。

## 数据迁移策略

本次只新增可空字段和带默认值字段，不回填历史数据：

1. 历史 ChapterPlan 默认 `status = planned`。
2. 历史 ChapterPlan 默认 `canonStatus = draft`。
3. 历史 ChapterPlan 的 `volumeId/sourceType/sourceId` 为空。
4. 既有 Volume / Chapter 数据保持原状。

## 回滚策略

如需回滚：

1. 确认业务不再依赖 ChapterPlan 的分卷关联和状态字段。
2. 删除新增外键和索引。
3. 删除 `ChapterPlan.volumeId/status/canonStatus/sourceType/sourceId`。
4. 回退 Prisma schema 中的 `Volume.chapterPlans` 与 `ChapterPlan.volume` relation。

注意：回滚会丢失章节计划与分卷的关联，以及计划确认 / 归档状态。

## 风险

- `ChapterPlan.volumeId` 与 `ChapterPlan.chapterId` 分别可空，数据库只能保证目标存在，不能自动保证二者属于同一 project/volume 边界；需要 service 层校验。
- `status` 是 String 而非 enum，需由 service 层限制 P1 允许值。
- 新增索引会增加少量写入成本，但 Planning P1 预计读多写少。

## 验证方式

已执行：

```bash
pnpm --filter @ai-novel/api exec prisma format
pnpm --filter @ai-novel/api exec prisma validate
pnpm --filter @ai-novel/api exec prisma migrate dev --create-only --name add_planning_p1_fields
pnpm db:generate
```

验证重点：

- Prisma schema 能格式化并通过校验。
- migration 以 create-only 方式生成。
- migration 未新增 `VolumePlan`。
- migration 未扩展 `GenerationTask`、`ContextSnapshot`、`PromptRender` 或 AI 生成相关 schema。
