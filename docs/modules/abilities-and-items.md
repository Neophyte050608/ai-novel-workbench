# 能力与道具模块

## 职责

能力与道具模块管理小说中会被角色、势力、物种、地点和剧情长期引用的“可获得、可成长、可装配、可触发规则”的资源。

UI 层可以作为一个工作台模块：

```txt
能力与道具
├── 道具
└── 技能 / 能力
```

数据层不强行合成一张表。道具和技能共享部分字段，但生命周期和专属字段不同，应拆成独立实体。

## 核心实体

P1 设计实体：

- `StoryItem`
- `StoryItemState`
- `StoryItemRule`
- `Ability`
- `AbilityRule`

P2 后置实体：

- `StoryItemUsage`
- `CharacterItem`
- `CharacterAbility`
- `Inventory`
- `AbilityTree`

## StoryItem 边界

`StoryItem` 负责剧情道具、关键物品、遗物、装备、文书、载体等。

适合进入 `StoryItem` 的内容：

- 太玄剑
- 封神榜残页
- 主角旧怀表
- 黑匣子
- 契约戒指
- 白塔审判令
- 龙骨钥匙
- 记忆芯片
- 神树种子

不适合进入 `StoryItem` 的内容：

- 无剧情作用的普通杂物
- 纯世界概念或体系设定
- 技能/能力本体

## Ability 边界

`Ability` 负责技能、功法、法术、异能、天赋、科技能力、仪式能力、战斗技巧等可获得、可掌握、可成长或可被封印的能力。

适合进入 `Ability` 的内容：

- 御剑术
- 太玄剑诀
- 幻境织造
- 龙息
- 记忆上传
- 精神链接
- 血脉觉醒
- 白塔审判仪式

`Ability` 是叙事能力，不是 RPG 技能表。不要引入 damage、cooldown、manaCost、range、duration 等数值技能字段。

## 与现有实体的关系

1. `StoryItem` 与 `Ability` 可以在 UI 中同属“能力与道具”模块，但数据层分表。
2. 角色装配道具、掌握技能，P1 先通过 `Relationship` 表达。
3. 角色能力掌握程度、装备状态、库存等复杂能力后置为 `CharacterAbility` / `CharacterItem` / `Inventory`。
4. `SpeciesAbility` 当前保留为物种专属能力模板，不立即合并到 `Ability`。
5. 后续可评估将 `SpeciesAbility` 对齐为 `Ability + Relationship(species has_ability ability)`。
6. 道具和技能的硬规则进入 `WorldRule`，通过 `StoryItemRule` / `AbilityRule` 关联。

## 共享字段原则

`StoryItem` 和 `Ability` 应共享以下字段思想：

| 字段 | 中文说明 |
|---|---|
| `projectId` | 所属小说项目 |
| `name` | 名称 |
| `aliases` | 别名 / 又称 |
| `summary` | 简短摘要 |
| `description` | 详细说明 |
| `grade` | 品级 |
| `rarity` | 稀有度 |
| `growthType` | 成长方式 |
| `acquireMethod` | 获得方式 |
| `status` | 当前状态 |
| `visibility` | 公开程度 |
| `importance` | 重要度 |
| `canonStatus` | 正史状态 |
| `sourceType/sourceId` | 来源追踪 |
| `createdAt/updatedAt/deletedAt` | 系统字段 |

## StoryItem 推荐字段

| 字段 | 中文说明 |
|---|---|
| `id` | 道具 ID |
| `projectId` | 所属小说项目 |
| `parentId` | 父级道具 / 套装 / 部件 |
| `name` | 道具名称 |
| `aliases` | 别名 / 又称 |
| `itemType` | 道具类型 |
| `narrativeRole` | 叙事功能 |
| `summary` | 简短摘要 |
| `description` | 详细描述 |
| `appearance` | 外观 |
| `origin` | 来源 / 来历 |
| `abilities` | 能力摘要 |
| `limitations` | 限制摘要 |
| `cost` | 使用代价摘要 |
| `grade` | 品级 |
| `rarity` | 稀有度 |
| `growthType` | 成长方式 |
| `acquireMethod` | 获得方式 |
| `status` | 当前状态 |
| `visibility` | 公开程度 |
| `importance` | 重要度 |
| `canonStatus` | 正史状态 |
| `orderIndex` | 同级排序 |
| `sourceType/sourceId` | 来源追踪 |
| `createdAt/updatedAt/deletedAt` | 系统字段 |

### itemType 建议值

```txt
weapon          武器
armor           防具
artifact        神器 / 遗物
relic           古物
key             钥匙 / 凭证
document        文书 / 卷轴 / 令牌
medicine        药物
tool            工具
device          装置
vehicle         载具
core            核心 / 能量源
container       容器
contract        契约物
memory_medium   记忆载体
map             地图
currency        货币 / 资源凭证
other           其他
```

### narrativeRole 建议值

```txt
plot_device      推动剧情的道具
macguffin        争夺核心物
weapon           战斗关键
key              解锁/通行关键
evidence         证据
symbol           象征物
memory_anchor    记忆锚点
contract_token   契约凭证
curse_source     诅咒源头
power_source     力量来源
foreshadowing    伏笔道具
background       背景道具
other            其他
```

## StoryItemState 推荐字段

`StoryItemState` 描述某个道具在某个章节 / 阶段后的状态快照。

| 字段 | 中文说明 |
|---|---|
| `id` | 道具状态 ID |
| `projectId` | 所属小说项目 |
| `storyItemId` | 对应道具 ID |
| `chapterId` | 关联章节 ID |
| `sceneId` | 后续关联场景 ID，可暂缓 |
| `stage` | 阶段，例如 before_chapter / after_chapter / manual |
| `orderIndex` | 排序 |
| `status` | 此阶段状态 |
| `holderType` | 持有者类型，例如 character / faction / location |
| `holderId` | 持有者 ID |
| `locationId` | 所在地点 ID |
| `condition` | 完好 / 损坏 / 封印等细节 |
| `visibility` | 公开程度 |
| `stateNote` | 状态备注 |
| `eventSummary` | 此阶段事件摘要 |
| `sourceType/sourceId` | 来源追踪 |
| `createdAt/updatedAt` | 系统字段 |

说明：

- `holderType/holderId` 作为状态快照使用。
- 长期归属、历史关系仍可通过 `Relationship` 表达。
- 如果后续需要严格外键，可拆 `CharacterItem` / `Inventory`。

## StoryItemRule 推荐字段

`StoryItemRule` 连接剧情道具与 `WorldRule`。

| 字段 | 中文说明 |
|---|---|
| `id` | 关联 ID |
| `projectId` | 所属小说项目 |
| `storyItemId` | 道具 ID |
| `worldRuleId` | 世界规则 ID |
| `relationType` | 规则关系类型 |
| `isPrimary` | 是否核心规则 |
| `enforcementLevel` | 执行强度 |
| `notes` | 备注 |
| `orderIndex` | 排序 |
| `createdAt/updatedAt` | 系统字段 |

## Ability 推荐字段

| 字段 | 中文说明 |
|---|---|
| `id` | 能力 ID |
| `projectId` | 所属小说项目 |
| `parentId` | 上级技能 / 功法体系 / 技能树节点 |
| `name` | 能力名称 |
| `aliases` | 别名 / 又称 |
| `abilityType` | 能力类型 |
| `narrativeRole` | 叙事功能 |
| `summary` | 简短摘要 |
| `description` | 详细描述 |
| `effect` | 能力效果 |
| `cost` | 使用代价 |
| `limitations` | 限制 |
| `condition` | 使用条件 |
| `grade` | 品级 |
| `rarity` | 稀有度 |
| `growthType` | 成长方式 |
| `acquireMethod` | 获得方式 |
| `inheritanceType` | 传承方式 |
| `status` | 当前状态 |
| `visibility` | 公开程度 |
| `importance` | 重要度 |
| `canonStatus` | 正史状态 |
| `orderIndex` | 同级排序 |
| `sourceType/sourceId` | 来源追踪 |
| `createdAt/updatedAt/deletedAt` | 系统字段 |

### abilityType 建议值

```txt
martial_art      武技
spell            法术
cultivation      功法
technique        技巧
talent           天赋
bloodline        血脉能力
superpower       异能
technology       科技能力
ritual           仪式
passive          被动能力
mental           精神能力
movement         身法 / 移动
crafting         制作 / 炼制
social           社交 / 魅惑
other            其他
```

## AbilityRule 推荐字段

`AbilityRule` 连接能力与 `WorldRule`。

| 字段 | 中文说明 |
|---|---|
| `id` | 关联 ID |
| `projectId` | 所属小说项目 |
| `abilityId` | 能力 ID |
| `worldRuleId` | 世界规则 ID |
| `relationType` | 规则关系类型 |
| `isPrimary` | 是否核心规则 |
| `enforcementLevel` | 执行强度 |
| `notes` | 备注 |
| `orderIndex` | 排序 |
| `createdAt/updatedAt` | 系统字段 |

## grade / rarity / growthType / acquireMethod

### grade 品级

不同题材差异较大，P1 使用 `String?`，不做 enum。

示例：

```txt
凡品
黄阶
玄阶
地阶
天阶
神级
S级
禁术
未知
```

### rarity 稀有度

```txt
common
uncommon
rare
epic
legendary
unique
unknown
```

### growthType 成长方式

```txt
static          固定
leveling        阶段成长
awakening       觉醒
unlocking       解锁封印
evolution       进化
practice        修炼提升
external        外物强化
unknown         未知
```

### acquireMethod 获得方式

P1 使用文本描述，例如：

```txt
剑冢试炼获得
青云宗外门传授
血脉自然觉醒
白塔仪式植入
击败守门人后取得
```

## 关系策略

P1 通过 `Relationship` 表达：

```txt
Character -> StoryItem
Character -> Ability
Faction -> StoryItem
Faction -> Ability
Species -> Ability
Location -> StoryItem
StoryItem -> Ability
```

典型关系：

```txt
owns
uses
equips
seeks
lost
inherited
knows
masters
learns
awakens
sealed
counteracts
requires
```

P2 可根据复杂度拆：

```txt
CharacterItem
CharacterAbility
Inventory
```

## UI 设计原则

工作台模块：

```txt
能力与道具
├── 道具
└── 技能 / 能力
```

详情分组建议：

### 道具

```txt
基础信息
外观与来源
效果与限制
状态与归属
规则
关系
```

### 技能 / 能力

```txt
基础信息
效果与限制
成长与获得
规则
关系
```

说明：

- 模块内可以使用“道具 / 技能”分类切换。
- 不表示实体详情内部要拆很多页签。
- 详情仍采用长页面分组展示。

## Context Builder 读取原则

生成章节/场景时，如果相关道具或能力被选中，应读取：

```txt
StoryItem / Ability 基础档案
最新 StoryItemState
StoryItemRule / AbilityRule -> WorldRule
Relationship 中的人物/地点/势力/物种关系
相关 MemoryRecord
```

优先级：

```txt
confirmed
importance 高
当前章节/场景相关
当前角色相关
当前地点相关
硬规则相关
```

## 开发规则

1. 道具和技能 UI 可同模块展示，但数据层分实体。
2. 不用自由 JSON 替代道具状态、规则关联和能力规则。
3. `StoryItem` 不等同普通杂物表，只管理有剧情作用的关键物品。
4. `Ability` 是叙事能力，不是 RPG 数值技能表。
5. P1 不做 `StoryItemUsage`、`CharacterItem`、`CharacterAbility`、`Inventory`。
6. P1 不迁移或合并现有 `SpeciesAbility`。
7. 任何 AI 生成道具/能力的结果默认 draft，用户确认后才 confirmed。


## P1 实施状态

本模块 P1 已落地为两组独立 API 与工作台 UI：

- 后端实体：`StoryItem`、`StoryItemState`、`StoryItemRule`、`Ability`、`AbilityRule`。
- 道具 API：`/projects/:projectId/story-items`，含 CRUD、`confirm`、`archive`、`profile`、`states` 子资源、`rules` 子资源。
- 能力 API：`/projects/:projectId/abilities`，含 CRUD、`confirm`、`archive`、`profile`、`rules` 子资源。
- 工作台入口：左侧导航“能力与道具”，模块内通过“道具 / 技能/能力”切换分类；详情沿用长页面分组和查看态/编辑态。

P1 暂不做角色装备/掌握关系的专用表；跨实体关系仍按本文“关系策略”通过 `Relationship` 或后续 P2 专表承载。
