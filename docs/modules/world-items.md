# WorldItems 模块

## 阶段性结论

`WorldItem` 不再作为所有世界观实体的大一统容器。

后续世界观领域应拆分为多个一等实体：

- `Location`：地点、区域、建筑、秘境、星球、空间等。
- `Faction`：势力、组织、宗门、国家、公司、阵营等。
- `Species`：物种、种族、生物类型、血脉族群等。
- `StoryItem`：剧情道具、神器、装备、线索物、载体、关键物品等。
- `WorldRule`：世界规则、力量规则、限制、法则、禁忌、社会运行规则等。
- `WorldItem`：收窄为通用世界设定。

本文件记录阶段性边界，作为后续逐实体细化 schema、API、UI、Context Builder 读取策略的依据；当前不表示这些实体已经实现。

## 职责

`WorldItem` 收窄后，负责管理不适合进入一等实体的通用世界设定，例如：

- 体系：修炼体系、科技体系、魔法体系、经济体系、教育体系等。
- 历史：历史背景、重大历史阶段、传说、纪元设定等。
- 文化：习俗、信仰、语言、审美、礼仪、价值观等。
- 概念：专有名词、抽象设定、世界观术语、特殊现象等。
- 社会制度：等级制度、法律、货币、职业体系、身份制度等。
- 其他暂未形成独立生命周期的非一等实体设定。

## 不再长期承载的内容

以下内容不应长期塞进 `WorldItem`：

- 地点：应进入 `Location`。
- 势力 / 组织：应进入 `Faction`。
- 物种 / 种族 / 生物类型：应进入 `Species`。
- 剧情道具 / 关键物品：应进入 `StoryItem`。
- 世界规则 / 法则 / 限制：应进入 `WorldRule`。

如果短期为了过渡仍存在历史 `WorldItem(type=location/organization/species/item/rule)` 数据，后续应规划迁移和兼容读取策略，避免新增数据继续扩大混用范围。

## 推荐类型边界

`WorldItem` 后续适合保留的类型方向：

- `system`：体系类设定，例如修炼体系、科技体系、魔法体系。
- `history`：历史阶段、历史事件背景、传说来源。
- `culture`：文化、信仰、习俗、语言、礼仪。
- `concept`：抽象概念、术语、特殊现象。
- `social_system`：社会制度、阶级、法律、货币、职业体系。
- `custom`：确实无法归入一等实体或上述类型的通用设定。

不建议继续把 `location`、`organization`、`species`、`item`、`rule` 作为长期 WorldItem 主类型。

## 统一字段原则

后续 `Location`、`Faction`、`Species`、`StoryItem`、`WorldRule`、`WorldItem` 等世界观实体应尽量遵循统一字段原则，便于列表展示、筛选、Context Builder 排序和跨实体关系建模。

通用字段建议：

| 字段 | 说明 |
|---|---|
| `projectId` | 所属小说项目 ID，所有项目内资源必须具备。 |
| `name` / `title` | 实体名称；偏实体对象优先 `name`，偏规则/条目标题可用 `title`。 |
| `aliases` | 别名、曾用名、外号、译名等。 |
| `summary` | 短摘要，用于列表、上下文压缩和快速识别。 |
| `description` / `content` | 详细描述；偏实体档案用 `description`，偏设定正文可用 `content`。 |
| `status` | 生命周期或存在状态，例如 active/inactive/destroyed/unknown；具体枚举按实体细化。 |
| `visibility` | 叙事可见性，例如 public/hidden/secret，用于区分读者/角色/作者视角。 |
| `importance` | 重要度，用于 Context Builder 排序和检索优先级。 |
| `canonStatus` | 正史状态：draft / confirmed / archived。 |
| `sourceType` | 来源类型，例如 user / generation_task / imported / chapter_summary。 |
| `sourceId` | 来源记录 ID。 |
| `createdAt` | 创建时间。 |
| `updatedAt` | 更新时间。 |
| `deletedAt` | 软删除时间。 |

字段命名应在逐实体设计时保持一致，除非存在明确领域语义差异。

## Relationship 连接层

`Relationship` 是跨实体连接层，不应把所有跨实体关系写死为单一外键字段。

典型连接包括：

- `Character` 与 `Location`：出生于、居住于、当前位于、被封印于。
- `Character` 与 `Faction`：成员、领袖、创立者、卧底、敌对、盟友。
- `Character` 与 `Species`：属于某物种、拥有某血脉。
- `Character` 与 `StoryItem`：拥有、使用、寻找、失去、被绑定。
- `Location` 与 `Faction`：控制、占领、发源、管辖。
- `Species` 与 `Location`：栖息于、起源于、迁徙至。
- `WorldRule` 与其他实体：约束、赋能、禁止、例外适用。
- `WorldItem` 与其他实体：解释、背景、属于某体系、受到某制度影响。

开发时应优先考虑 `Relationship` 承载多对多、多阶段、有方向、有来源追踪的关系；实体字段只保留稳定档案和必要缓存。

## 与 Characters 模块的关系

1. 具名宠物、灵兽、坐骑、器灵、妖兽、AI 生命等，如果有独立剧情状态和关系，应作为 `Character`。
2. 物种、种族、生物类型等设定后续应作为 `Species`，不再长期作为 `WorldItem(type=species)`。
3. 角色与物种、地点、势力、道具之间的连接不写死在 `Character` 字段上，通过 `Relationship` 表达。
4. 示例：`Character(小白)` 通过 `Relationship(belongs_to_species)` 指向 `Species(九尾灵狐)`。

## 开发规则

1. 本次文档结论不等于 schema/API/UI 已实现。
2. 新增或修改世界观实体 schema 前，必须先补对应模块文档和任务拆分。
3. 一等实体拆分应分阶段推进，避免一次性扩大实现范围。
4. 迁移历史 WorldItem 数据时必须通过 Prisma migration，并编写 migration 文档。
5. Context Builder 默认只读取 `confirmed` 实体，除非用户明确选择草稿。
6. 不允许为了 MVP 继续扩大自由 JSON 或 WorldItem 大容器用法，导致后续迁移困难。
