# Migration 0006: add-world-entity-foundation

## 背景

世界设定模块已完成 `WorldRule`、`Location`、`Faction`、`Species` 的文档设计，需要先落地长期可维护的数据基础。

本次迁移只做 Prisma schema 与数据库 migration，不实现 UI、API、AI 生成流程，也不修改人物 API。目标是为后续 Context Builder、实体 CRUD、关系编辑和生成链路提供结构化表与关系边界，避免继续把地点、势力、物种和规则压入自由文本或通用 `WorldItem`。

## 变更内容

新增世界规则实体：

- `WorldRule`
  - 记录规则标题、摘要、正文、类型、分类、优先级、状态、适用条件、效果、代价、例外、违反后果、硬规则标记、揭示状态、可见性、重要度、正典状态和来源追踪。
  - 不包含 `scopeType` / `scopeId`。
  - 不包含规则引擎字段，例如 `expression`、`ruleEngineJson`、`triggerScript`、`resolver`。
  - 增加 Project 关系与规则类型、分类、状态、正典状态、重要度、软删除索引。

新增地点实体：

- `Location`
  - 地点主档案，包含层级、名称、别名、类型、叙事角色、环境、氛围、地形、气候、进入规则、危险程度、生命周期状态、可见性、重要度、正典状态、排序和来源追踪。
  - 支持 `parentId` 自关联。
  - 关联 `LocationState`、`LocationRule`、`LocationFaction`。
- `LocationState`
  - 地点在章节或阶段上的状态快照。
  - 关联 `Project`、`Location`、可选 `Chapter`。
- `LocationRule`
  - 地点与世界规则的结构化关系。
  - 关联 `Project`、`Location`、`WorldRule`。
- `LocationFaction`
  - 地点与势力的控制、占据、影响等关系。
  - 关联 `Project`、`Location`、`Faction`。

新增势力实体：

- `Faction`
  - 势力主档案，包含层级、名称、别名、类型、叙事角色、理念、目标、组织结构、资源、状态、可见性、重要度、正典状态、排序和来源追踪。
  - 支持 `parentId` 自关联。
  - 关联 `FactionState`、`FactionMembership`、`FactionRelation` 源/目标关系、`FactionRule`、`LocationFaction`。
- `FactionState`
  - 势力在章节或阶段上的状态快照。
  - 关联 `Project`、`Faction`、可选 `Chapter`。
- `FactionMembership`
  - 角色与势力之间的结构化成员关系。
  - 关联 `Project`、`Faction`、`Character`。
- `FactionRelation`
  - 势力与势力之间的源/目标关系。
  - 关联 `Project`、源 `Faction`、目标 `Faction`。
- `FactionRule`
  - 势力与世界规则的结构化关系。
  - 关联 `Project`、`Faction`、`WorldRule`。

新增物种实体：

- `Species`
  - 物种主档案，包含层级、名称、别名、类型、叙事角色、外貌、寿命、繁衍、社会结构、稀有度、状态、可见性、重要度、正典状态、排序和来源追踪。
  - 支持 `parentId` 自关联。
  - 关联 `SpeciesTrait`、`SpeciesAbility`、`SpeciesRule`。
- `SpeciesTrait`
  - 物种稳定特征或被动特征。
  - 关联 `Project`、`Species`。
- `SpeciesAbility`
  - 物种叙事能力或可触发能力。
  - 使用 `masteryNotes` 字段记录掌握、熟练、失控或训练说明；不引入 `masteryLevel`。
  - 关联 `Project`、`Species`。
- `SpeciesRule`
  - 物种与世界规则的结构化关系。
  - 关联 `Project`、`Species`、`WorldRule`。

调整既有反向关系：

- `Project` 增加上述资源 relation 数组。
- `Chapter` 增加 `locationStates`、`factionStates` 反向关系。
- `Character` 增加 `factionMemberships` 反向关系。
- `WorldRule` 增加 `locationRules`、`factionRules`、`speciesRules` 反向关系。

## 数据迁移策略

本次迁移只新增表、外键和索引，不修改、删除或重命名既有业务字段。

已有数据处理策略：

1. 既有 `Project`、`Chapter`、`Character`、`WorldItem`、`Relationship` 等记录保持不变。
2. 新增表初始为空，不从现有自由文本或 `WorldItem` 自动拆分世界规则、地点、势力或物种数据，避免误迁移语义。
3. 后续若需要将历史 `WorldItem(type=location/organization/rule/species)` 转换为一等实体，应由专门导入/整理流程或人工确认流程完成。
4. 所有新增实体均带 `projectId`，项目删除时随 `Project` 级联删除。
5. 重要主档案和长期关系使用 `deletedAt` 软删除；阶段状态和规则关联表按当前设计不加入软删除字段。

## 回滚策略

开发阶段可通过 Prisma reset 或回退到上一条 migration 后重新迁移。

如果需要手动回滚，需要按依赖顺序删除新增表及其外键/索引：

1. 删除关系表和状态表：`SpeciesRule`、`SpeciesAbility`、`SpeciesTrait`、`FactionRule`、`FactionRelation`、`FactionMembership`、`FactionState`、`LocationFaction`、`LocationRule`、`LocationState`。
2. 删除主档案表：`Species`、`Faction`、`Location`、`WorldRule`。
3. 确认应用代码和 Prisma Client 不再引用这些模型后重新生成客户端。

本次迁移未变更 enum，也未删除旧字段，因此不涉及 PostgreSQL enum value 回滚或历史数据恢复。

## 风险

1. 新增表数量较多，Prisma Client 需要重新生成；旧客户端不会包含这些模型。
2. `LocationFaction` 依赖 `Location` 与 `Faction`，`FactionMembership` 依赖 `Faction` 与 `Character`，写入顺序需要由后续 API/服务层保证。
3. 迁移仅建立数据结构，不包含业务校验；例如同一项目下名称唯一、关系时间范围、源/目标势力不能相同等规则需要后续服务层决定。
4. 新旧世界设定模型会阶段性并存：既有 `WorldItem` 仍存在，后续读取侧需要明确哪些内容从一等实体读取，哪些继续从 `WorldItem` 读取。
5. 多数分类字段暂用 `String`，便于沿用模块文档中的建议值；后续若收敛为 enum，需要单独评审兼容迁移。

## 验证方式

- [x] `pnpm --filter @ai-novel/api exec prisma format` 成功
- [x] `pnpm --filter @ai-novel/api exec prisma migrate dev --name add_world_entity_foundation --create-only` 成功，生成 migration `20261117132845_add_world_entity_foundation`
- [x] `pnpm db:generate` 成功
- [x] `pnpm db:migrate` 成功，已在本地 PostgreSQL `localhost:55432/ai_novel_workbench` 应用 migration，并再次生成 Prisma Client
- [x] `pnpm --filter @ai-novel/api exec prisma validate` 成功
- [x] `pnpm --filter @ai-novel/api typecheck` 成功
- [x] `pnpm build` 成功；Vite 输出既有 chunk size warning，构建未失败
