# 0013 extend ContextSnapshot for Context Builder P1

## 背景

Context Builder P1 需要在 AI 生成前构建可预览、可落库、可追溯的结构化上下文快照。既有 `ContextSnapshot` 已有 `projectId`、`chapterId`、`purpose`、`payload`、`sourceRefs`、`tokenEstimate` 和时间戳，但缺少通用目标字段、场景目标字段和构建元数据。

## 变更内容

- 扩展 `ContextSnapshot`：
  - `targetType`：上下文目标类型，P1 使用 `chapter` 或 `scene`。
  - `targetId`：上下文目标 ID。
  - `sceneId`：场景生成上下文的目标场景。
  - `metadata`：构建参数与统计信息，如 `includeDrafts`、`selectedDraftIds`、`previousChapterCount`、`sourceRefCount`。
- 调整索引：
  - 删除旧的 `projectId,createdAt` 单一索引。
  - 新增 `projectId,purpose,createdAt`。
  - 新增 `projectId,targetType,targetId,createdAt`。
  - 新增 `projectId,chapterId,createdAt`。
  - 新增 `projectId,sceneId,createdAt`。

## 数据迁移策略

仅新增可空字段和索引，不迁移历史 `ContextSnapshot` 数据。历史快照的 `targetType`、`targetId`、`sceneId`、`metadata` 保持为空，仍可通过 `projectId` 和 `chapterId` 追溯。

## 回滚策略

如需回滚，可删除新增索引和新增字段，并恢复旧 `projectId,createdAt` 索引。回滚会丢失 P1 新快照的通用目标信息和 metadata，但不影响 `GenerationTask` 与历史 payload/sourceRefs。

## 风险

- `payload` 和 `sourceRefs` 仍是 JSON，API 必须保证写入结构稳定。
- P1 不做 PromptRender 或 GenerationTask 创建，因此调用方需要显式保存 snapshot 后再进入后续生成流程。

## 验证方式

- `pnpm --filter @ai-novel/api exec prisma format`
- `pnpm --filter @ai-novel/api exec prisma validate`
- `pnpm db:generate`
- `pnpm --filter @ai-novel/api exec tsx src/modules/context-builder/context-builder.service.spec.ts`
- `pnpm --filter @ai-novel/api typecheck`
