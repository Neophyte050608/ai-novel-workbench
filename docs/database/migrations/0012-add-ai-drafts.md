# 0012 add AI drafts

## 背景

AI 生成结果需要先进入可审核草稿层，不能直接写入 confirmed/canon 正式数据。本迁移新增 `GeneratedDraft`，用于承接章节正文、场景正文、场景计划和章节摘要等 P1 草稿。

## 变更内容

- 新增 enum `GeneratedDraftStatus`：`pending`、`applied`、`discarded`、`superseded`。
- 新增表 `GeneratedDraft`，包含项目归属、目标类型、目标 ID、草稿类型、payload、预览文本、来源任务、反馈、前序草稿、应用目标、生命周期时间戳和软删除字段。
- 建立 `Project -> GeneratedDraft` 关系。
- 建立索引：
  - `projectId,status`
  - `projectId,targetType,targetId,status`
  - `sourceTaskId`
  - `previousDraftId`
  - `deletedAt`

## 数据迁移策略

仅新增 enum 和表，不迁移现有业务数据。历史章节版本、场景版本、计划和摘要保持不变。

## 回滚策略

如需回滚，可删除 `GeneratedDraft` 表并删除 `GeneratedDraftStatus` enum。回滚会丢失已创建的 AI 草稿审稿记录；正式应用后的目标领域数据不受影响。

## 风险

- `payload` 是 JSON，必须由 API apply allow-list 解释，不能作为长期绕过领域表的万能字段。
- P1 regenerate 是 mock 新草稿，不调用 AI，UI 和 API 文案需要保持清楚。

## 验证方式

- `pnpm --filter @ai-novel/api exec prisma format`
- `pnpm --filter @ai-novel/api exec prisma validate`
- `pnpm db:generate`
- API typecheck 和 AI drafts service 行为测试
