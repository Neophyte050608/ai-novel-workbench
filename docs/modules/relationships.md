# Relationship 统一关系层

## 1. 定位

`Relationship` 是项目内两个实体之间的通用、低频、跨实体连接层。它用于表达“没有专属业务结构承载、但对创作上下文有价值”的连接，例如人物与地点的羁绊、道具与人物的归属线索、能力与势力的传承来源。

Relationship 不是万能关系表，也不是为了省建模成本而把所有关联都塞进一张表。凡是关系本身有明确领域语义、生命周期、查询频率或专属字段，应优先使用专表。

## 2. 使用边界

### 2.1 什么时候使用专表

使用专表的条件：

1. 关系是核心业务对象，有稳定的领域字段。
2. 关系需要高频展示、筛选、排序或聚合。
3. 关系有自己的子状态、时间线、权重规则或业务动作。
4. 关系会被 Context Builder 以固定结构读取。
5. 关系需要强约束，例如唯一性、外键、专属删除策略。

本项目中以下关系必须继续使用专表，不要用 Relationship 替代：

- `FactionMembership`：人物与势力成员关系，包含职位、部门、公开状态、任期等字段。
- `LocationFaction`：地点与势力控制/影响关系，包含影响等级、当前状态、起止时间等字段。
- `FactionRelation`：势力之间关系，包含势力关系专属语义。
- `LocationRule`：地点受世界规则影响的专属关联。
- `FactionRule`：势力受世界规则影响的专属关联。
- `SpeciesRule`：物种受世界规则影响的专属关联。
- `StoryItemRule`：道具受世界规则影响的专属关联。
- `AbilityRule`：能力受世界规则影响的专属关联。

### 2.2 什么时候使用 Relationship

使用 Relationship 的条件：

1. 关系跨两个实体，但暂时没有足够稳定的专属字段。
2. 关系较低频，主要用于详情页补充和 Context Builder 背景读取。
3. 关系语义可由 `relationType` + `description` 表达。
4. 关系两端实体都属于同一 Project 且未删除。
5. 后续若某类关系变高频或领域语义稳定，可以迁出为专表。

典型例子：

- 人物与地点：`born_in`、`haunts`、`protects_place`。
- 人物与道具：`owns`、`seeks`、`lost`。
- 人物与能力：`uses`、`learns`、`sealed_by`。
- 地点与物种：`habitat_of`、`forbidden_to`。
- 势力与能力：`teaches`、`monopolizes`。
- 道具与能力：`amplifies`、`contains`。

## 3. 字段语义

| 字段 | 语义 |
|---|---|
| `sourceType` | 来源端实体类型。合法值见“支持的实体类型”。 |
| `sourceId` | 来源端实体 ID。必须属于当前 Project 且未删除。 |
| `targetType` | 目标端实体类型。合法值见“支持的实体类型”。 |
| `targetId` | 目标端实体 ID。必须属于当前 Project 且未删除。 |
| `relationType` | 关系类型，必填，使用 snake_case 建议值或项目内约定值。 |
| `description` | 面向作者和上下文的自然语言说明。 |
| `strength` | 关系强度，非负整数；含义由关系类型解释。 |
| `importance` | 关系重要度，非负整数；Context Builder 可用于排序和预算裁剪。 |
| `direction` | 方向，默认 `directed`；可为 `directed` / `bidirectional`。 |
| `isCurrent` | 是否当前仍有效，默认 `true`。历史关系可设为 `false` 或归档。 |
| `startsAt` | 关系开始阶段，使用章节、阶段名或世界内时间文本。 |
| `endsAt` | 关系结束阶段，使用章节、阶段名或世界内时间文本。 |
| `canonStatus` | 生命周期：`draft` / `confirmed` / `archived`，默认 `draft`。 |
| `evidenceType` | 证据来源类型，例如 `chapter`、`chapter_summary`、`generation_task`、`user_note`。 |
| `evidenceId` | 证据来源 ID。第一版不强制外键，供追溯使用。 |
| `deletedAt` | 软删除时间；普通列表和 Context Builder 默认排除。 |

## 4. 支持的实体类型

API 支持以下 `sourceType` / `targetType`：

- `character`
- `location`
- `faction`
- `species`
- `story_item`（对应 Prisma `StoryItem`）
- `ability`
- `world_rule`
- `world_item`
- `chapter`
- `chapter_plan`

第一版 UI 仅暴露：`character` / `location` / `faction` / `species` / `story_item` / `ability` / `world_rule` / `world_item`。`chapter` / `chapter_plan` 由 API 先支持，待章节和规划 UI 成熟后再接入选择器。

## 5. relationType 建议值

`relationType` 使用 snake_case。建议按实体关系分类维护，项目可扩展但应避免同义词泛滥。

### 5.1 人物相关

- 人物 ↔ 人物：`ally`、`rival`、`enemy`、`mentor`、`student`、`family`、`romantic`、`owes_debt_to`。
- 人物 ↔ 地点：`born_in`、`lives_in`、`visited`、`protects_place`、`exiled_from`、`haunts`。
- 人物 ↔ 势力：低频补充可用 `associated_with`、`opposes`；正式成员关系必须用 `FactionMembership`。
- 人物 ↔ 道具：`owns`、`seeks`、`lost`、`created`、`inherited`。
- 人物 ↔ 能力：`uses`、`learns`、`teaches`、`sealed_by`、`countered_by`。

### 5.2 世界观实体相关

- 地点 ↔ 地点：`near`、`contains_path_to`、`hidden_within`、`mirrors`。
- 地点 ↔ 物种：`habitat_of`、`forbidden_to`、`origin_of`。
- 地点 ↔ 道具：`contains`、`hides`、`produces`、`requires_item`。
- 势力 ↔ 物种：`protects`、`hunts`、`descended_from`、`allied_with_species`。
- 势力 ↔ 能力：`teaches`、`monopolizes`、`forbids`、`researches`。
- 物种 ↔ 能力：`innate_ability`、`can_awaken`、`vulnerable_to`。
- 道具 ↔ 能力：`amplifies`、`contains`、`requires_ability`、`suppresses`。

### 5.3 规则、章节与计划相关

- 实体 ↔ 世界规则：低频解释可用 `influenced_by`、`exception_to`；正式规则关联必须用 `LocationRule` / `FactionRule` / `SpeciesRule` / `StoryItemRule` / `AbilityRule`。
- 实体 ↔ 章节：`appears_in`、`revealed_in`、`foreshadowed_in`。
- 实体 ↔ 章节计划：`planned_for`、`depends_on_plan`、`conflicts_with_plan`。

## 6. API 设计

Base path：`/projects/:projectId/relationships`

- `GET /projects/:projectId/relationships`
  - 查询项目内关系，默认排除软删除。
  - 支持筛选：`sourceType/sourceId`、`targetType/targetId`、`entityType/entityId`（source 或 target 命中）、`relationType`、`canonStatus`、`isCurrent`、`page/pageSize`。
  - 返回：`{ items, page, pageSize, total }`。
- `POST /projects/:projectId/relationships`
  - 创建关系，默认 `direction=directed`、`canonStatus=draft`、`isCurrent=true`。
  - 校验 Project 存在、两端实体合法且同项目、source/target 不完全相同、`relationType` 非空、`importance/strength` 非负整数。
  - 对 `projectId + source + target + relationType + isCurrent=true + deletedAt=null` 做弱重复检测，命中返回 Conflict。
- `GET /projects/:projectId/relationships/:relationshipId`
  - 读取单条关系，并校验项目边界。
- `PATCH /projects/:projectId/relationships/:relationshipId`
  - 更新关系基础字段；若修改端点，重新校验端点边界和重复关系。
- `DELETE /projects/:projectId/relationships/:relationshipId`
  - 软删除，写入 `deletedAt`。
- `POST /projects/:projectId/relationships/:relationshipId/confirm`
  - 将 `canonStatus` 置为 `confirmed`。
- `POST /projects/:projectId/relationships/:relationshipId/archive`
  - 将 `canonStatus` 置为 `archived`。

## 7. UI 设计

第一版在工作台实体详情的“关系”分组中接入真实关系，不使用 tabs / 折叠，保持长页面分组。

详情页行为：

1. 选择实体后，通过 `entityType/entityId` 查询当前实体相关关系。
2. 关系列表展示方向、另一端实体类型、另一端名称/ID、`relationType`、`description`、`strength`、`importance`。
3. 新增关系需要选择：目标类型、目标对象、关系类型、方向、说明、重要度、强度。
4. 删除关系调用 Relationship DELETE，执行软删除。
5. 目标对象选择按类型加载实体列表：人物、地点、势力、物种、道具、能力、世界规则、通用世界设定。章节和章节计划暂不在第一版 UI 暴露。
6. 不显示 AI 相关按钮。

## 8. Context Builder 读取规则

1. Context Builder 不通过 HTTP 调用 Relationship API，应注入 `RelationshipsService` 或后续专门的领域查询接口。
2. 默认读取 `canonStatus=confirmed`、`isCurrent=true`、`deletedAt=null` 的关系。
3. 草稿关系只有在用户明确选择草稿上下文、调试模式或生成任务策略允许时读取。
4. 默认按 `importance desc`、`updatedAt desc` 排序，并根据上下文预算裁剪。
5. 读取实体上下文时，使用 `entityType/entityId` 查询 source 或 target 命中的关系。
6. `direction=bidirectional` 表示两端语义对等；`direction=directed` 时 Prompt 渲染应保留 source → target 方向。
7. 专属关系表的数据由各自模块提供给 Context Builder；Relationship 只补充通用低频连接，不覆盖专表结果。

## 9. P1 落地范围

本阶段已落地统一关系层的最小闭环：后端提供 `list/create/detail/update/delete/confirm/archive`，列表支持 `entityType/entityId` 双向查询；创建和更新会校验实体类型、Project 边界、软删除状态、端点不能完全相同、默认 `draft/isCurrent/directed` 和活动关系弱重复。工作台实体详情页使用真实 Relationship 数据展示“关系”分组，并支持在已接入实体之间新增、删除关系。
