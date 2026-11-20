# add_scene_p1_models

## 背景

`docs/modules/scenes.md` 已批准 Scene P1 设计。P1 目标是在章节内建立更细的场景结构线，支持写前计划、正文版本、摘要和交接卡，同时暂不接入 API、UI、AI 生成、上下文快照或 Scene 资产关系表。

本迁移对应 Prisma migration：`apps/api/prisma/migrations/20261118100828_add_scene_p1_models/migration.sql`。

## 变更内容

新增 5 个模型 / 数据表：

1. `Scene`
   - 章节内场景结构锚点。
   - 强关联 `Project`、`Chapter`。
   - 包含 `status String @default("planned")`、`canonStatus CanonStatus @default(draft)`、排序、标题、目标、叙事时间、轻指针字段和软删除字段。
   - `povCharacterId`、`primaryLocationId`、`currentPlanId`、`currentVersionId` 仅保留 ID，不建立 Prisma relation。

2. `ScenePlan`
   - 场景写前计划。
   - 强关联 `Project`、`Chapter`、`Scene`、可选 `ChapterPlan`。
   - 保留计划目标、大纲、冲突、选择、后果、读者承诺 / 兑现、下一场钩子、`constraints Json?`、`canonStatus` 和软删除字段。

3. `SceneVersion`
   - 场景正文版本。
   - 强关联 `Project`、`Chapter`、`Scene`、可选自引用 `basedOnVersion`。
   - 包含 `source String @default("user")`、正文、字数、变更说明、追溯来源和软删除字段。
   - 不增加 `canonStatus`，不关联 `GenerationTask`。

4. `SceneSummary`
   - 场景实际发生内容摘要。
   - 强关联 `Project`、`Chapter`、`Scene`、可选 `SceneVersion`。
   - 保留 `keyEvents`、`characterChanges`、`locationChanges`、`factionChanges`、`worldRuleChanges`、`newFacts`、`readerVisibleInfo` 等 Json 字段，以及 `canonStatus` 和软删除字段。

5. `SceneHandoff`
   - 场景后的下一场写作交接卡。
   - 强关联 `Project`、`Chapter`、`Scene`、可选 `SceneVersion`。
   - 保留 `readerKnows`、`actualChanges`、`openQuestions`、`promisesOpened`、`promisesClosed`、`nextSceneMust`、`riskNotes` 等 Json 字段，以及 `canonStatus` 和软删除字段。
   - `nextSceneId` 仅保留 ID，不建立 Prisma relation。

同时补充 relation 数组：

- `Project.scenes / scenePlans / sceneVersions / sceneSummaries / sceneHandoffs`
- `Chapter.scenes / scenePlans / sceneVersions / sceneSummaries / sceneHandoffs`
- `ChapterPlan.scenePlans`
- `SceneVersion.derivedVersions / summaries / handoffs`

索引覆盖高频读取路径：

- 按 project + chapter + orderIndex 读取章节内 Scene / ScenePlan。
- 按 project + scene + createdAt 读取正文版本、摘要、交接历史。
- 按 project + canonStatus 读取可进入上下文的计划、摘要和交接。
- 按轻指针字段读取 `povCharacterId`、`primaryLocationId`、`nextSceneId`。
- 所有新增软删除表添加 `deletedAt` 索引。

## 数据迁移策略

本次只新增表和外键，不修改既有表字段含义，不回填历史数据。

上线后：

1. 既有 `Project` / `Chapter` 数据保持原状。
2. 历史章节不会自动拆分为 Scene。
3. 如果后续需要从章节正文拆分场景，应通过独立导入 / 拆分流程生成 `Scene` 与 `SceneVersion`，并由服务层校验 project / chapter / scene 边界。
4. `currentPlanId`、`currentVersionId`、`povCharacterId`、`primaryLocationId`、`nextSceneId` 的一致性由后续 service/API 层负责校验，本迁移不添加数据库外键。

## 回滚策略

如需回滚：

1. 确认业务未依赖 Scene P1 数据，或先导出需保留的数据。
2. 按依赖顺序删除新增表：
   - `SceneHandoff`
   - `SceneSummary`
   - `SceneVersion`
   - `ScenePlan`
   - `Scene`
3. 删除对应外键和索引会随表删除自动完成。
4. 回退 Prisma schema 中新增模型及 relation 数组。
5. 重新运行 `prisma migrate dev` / `prisma migrate deploy` 对齐环境。

注意：一旦生产环境已有 Scene 数据，直接 drop 表会丢失场景计划、正文版本、摘要和交接记录，必须先备份或编写数据迁出方案。

## 风险

- `projectId`、`chapterId`、`sceneId` 在子表中存在冗余，数据库外键只能保证目标存在，不能自动保证三者属于同一边界；需由 service 层校验。
- 轻指针字段没有数据库外键，错误 ID 需要由 service 层和后续一致性检查兜底。
- 新增多个索引会增加写入开销，但 P1 预计读多写少，优先保障章节内场景读取、版本历史、摘要 / handoff 聚合读取。
- `SceneVersion.content` 保存正文，后续数据增长需要关注备份体积和查询投影，列表接口不应默认读取全文。

## 验证方式

已执行：

```bash
pnpm --filter @ai-novel/api exec prisma format
pnpm --filter @ai-novel/api exec prisma validate
pnpm --filter @ai-novel/api exec prisma migrate dev --create-only --name add_scene_p1_models
pnpm db:generate
```

验证重点：

- Prisma schema 能格式化并通过校验。
- migration 以 create-only 方式生成，未主动应用到本地数据库。
- Prisma Client 能基于新增模型成功生成。
- migration SQL 不包含 `GenerationTask.sceneId`、`ContextSnapshot.sceneId`、`SceneCharacter`、`SceneLocation`、`SceneFaction`、`SceneWorldRule` 或 AI 生成相关 schema。