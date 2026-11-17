# Migration 0005: add-character-entity-foundation

## 背景

Characters 模块需要在不接入 UI、AI 生成和模型调用的前提下，先补齐人物实体的长期数据基础。

本次迁移落实 `docs/modules/characters.md` 中的 P1 人物实体骨架：角色稳定档案、阶段状态、多身份，以及通用关系的叙事时间和来源证据字段。同时，按照 `docs/modules/world-items.md` 的边界，物种 / 种族 / 生物类型不作为 `Character` 字段，而归入 `WorldItem(type=species)`，再通过 `Relationship` 与角色连接。

## 变更内容

调整 enum：

- `WorldItemType`
  - 新增 `species`

调整 `Project` relation：

- 新增 `characterIdentities CharacterIdentity[]`

调整 `Character`：

- 新增 `kind String?`
- 新增 `lifeStatus String?`
- 新增 `background String?`
- 新增 `importance Int @default(0)`
- 新增 `sourceType String?`
- 新增 `sourceId String?`
- 新增 `identities CharacterIdentity[]`

调整 `CharacterState`：

- 新增 `stage String?`
- 新增 `orderIndex Int @default(0)`
- 新增索引 `[projectId, characterId, orderIndex]`

新增 `CharacterIdentity` 表：

- `id`
- `projectId`
- `characterId`
- `title`
- `description`
- `type`
- `isPublic`
- `startsAt`
- `endsAt`
- `importance`
- `canonStatus`
- `sourceType`
- `sourceId`
- `createdAt`
- `updatedAt`
- `deletedAt`

关系与索引：

- `CharacterIdentity.projectId -> Project.id`，级联删除
- `CharacterIdentity.characterId -> Character.id`，级联删除
- 索引 `[projectId, characterId]`
- 索引 `[projectId, canonStatus]`
- 索引 `[projectId, importance]`
- 索引 `[deletedAt]`

调整 `Relationship`：

- 新增 `importance Int @default(0)`
- 新增 `isCurrent Boolean @default(true)`
- 新增 `startsAt String?`
- 新增 `endsAt String?`
- 新增 `direction String?`
- 新增 `evidenceType String?`
- 新增 `evidenceId String?`

## 数据迁移策略

本次迁移只新增 enum 值、可空字段、带默认值字段、索引和新表，不删除或重命名已有字段。

已有数据处理策略：

1. 既有 `Character` 记录保留不变，新增字段默认为 `NULL` 或 `importance = 0`。
2. 既有 `CharacterState` 记录保留不变，新增 `stage` 默认为 `NULL`，`orderIndex = 0`。
3. 既有 `Relationship` 记录保留不变，新增字段默认为 `NULL`、`importance = 0`、`isCurrent = true`。
4. `CharacterIdentity` 是新表，不需要从 `Character.role` 或其他自由文本字段自动拆分身份，避免误迁移语义。
5. `WorldItemType.species` 只开放新类型，不修改既有 `WorldItem` 数据。

后续如果需要把历史角色描述拆成多个身份，应由业务用例或人工确认流程生成 `CharacterIdentity`，不能在本次 schema 迁移中猜测。

## 回滚策略

开发阶段可通过 Prisma reset 或回退到上一条 migration 后重新迁移。

如果需要手动回滚，需要：

1. 删除 `CharacterIdentity` 表及其索引和外键。
2. 删除 `Character` 上新增的 `kind`、`lifeStatus`、`background`、`importance`、`sourceType`、`sourceId` 字段。
3. 删除 `CharacterState` 上新增的 `stage`、`orderIndex` 字段和 `[projectId, characterId, orderIndex]` 索引。
4. 删除 `Relationship` 上新增的 `importance`、`isCurrent`、`startsAt`、`endsAt`、`direction`、`evidenceType`、`evidenceId` 字段。
5. `WorldItemType.species` 属于 PostgreSQL enum 新增值，生产环境不建议直接删除 enum value；如必须回滚，需要按 PostgreSQL enum 回滚方案重建 enum，并先确保没有 `WorldItem.type = species` 数据。

## 风险

1. `WorldItemType` 新增 enum 值后，旧版 Prisma Client 不认识 `species`，需要重新生成并部署客户端。
2. `CharacterIdentity.title` 为必填字段；新增身份数据时必须提供身份名称。
3. 新增字段暂未接入业务写入流程，本次只提供 schema 基础，不代表 UI/API/Context Builder 已完成支持。
4. `Relationship.evidenceType/evidenceId` 与端点字段 `sourceType/sourceId` 命名区分后，后续业务代码需要明确二者语义：端点来源 vs 证据来源。
5. 多个 `orderIndex = 0` 的历史状态记录仍可能存在，需要读取侧继续用 `createdAt` 或业务规则兜底排序。

## 验证方式

- [x] `pnpm --filter @ai-novel/api exec prisma format` 成功
- [x] `pnpm --filter @ai-novel/api exec prisma migrate dev --name add_character_entity_foundation --create-only` 成功，按 Prisma Migrate 从业务 schema 生成 migration
- [x] `pnpm db:generate` 成功
- [x] `pnpm db:migrate` 成功，已在本地 PostgreSQL `localhost:55432/ai_novel_workbench` 应用 migration，并再次生成 Prisma Client
- [x] `pnpm --filter @ai-novel/api exec prisma validate` 成功
- [ ] `pnpm --filter @ai-novel/api typecheck` 未通过：失败点为既有 `src/modules/llm-provider/adapters/magpie.adapter.ts(137,13)` 参数 `item` 隐式 `any`，与本次 schema 变更无关
