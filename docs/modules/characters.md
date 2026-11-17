# Characters 模块

## 职责

管理角色档案、角色状态历史、角色身份，以及角色与其他实体之间的叙事关系。

本模块中的 `Character` 不仅指“人类人物”，而是指：

> 有叙事身份、状态、关系、行为连续性的角色个体。

因此，主角、反派、配角、宠物、灵兽、坐骑、器灵、妖兽、神明分身、AI 生命等，只要是具名个体并会参与剧情，都应作为 `Character` 管理。

## 核心实体

- `Character`
- `CharacterState`
- `CharacterIdentity`
- `Relationship`

其中：

- `Character`：描述“这个角色是谁”。
- `CharacterState`：描述“这个角色在某个阶段 / 某一章前后是什么状态”。
- `CharacterIdentity`：描述“这个角色拥有哪些公开或隐藏身份”。
- `Relationship`：描述角色与角色、地点、势力、物种、道具等实体之间的关系。

## 边界

### Character

`Character` 只保存角色自身稳定档案。

适合放入 `Character` 的内容：

- 名称
- 角色种类
- 叙事定位
- 生存 / 存在状态
- 外貌 / 形态
- 性格
- 动机
- 背景经历
- 说话 / 表达风格
- 成长线
- 重要度
- 正史状态
- 来源追踪

不适合直接放入 `Character` 的内容：

- 出生地
- 成长地
- 当前所在地
- 所属势力
- 宠物主人
- 物种 / 种族外键
- 道具归属
- 人物关系图

这些应通过 `Relationship` 或其他专门实体表达。

### CharacterState

`CharacterState` 描述角色在某个阶段的状态快照，不替代 `Character`。

适合放入 `CharacterState` 的内容：

- 关联章节
- 阶段，例如章节前、章节后、手动记录
- 所在位置文本缓存
- 身体状态
- 情绪状态
- 当前目标
- 已知秘密
- 阶段性关系变化
- 状态备注
- 来源追踪

`CharacterState.location` 可以作为高频读取的文本缓存，但正式地点关系仍应通过 `Relationship` 表达。

### CharacterIdentity

`CharacterIdentity` 描述角色的多个身份。

角色可能同时拥有：

- 明面身份
- 隐藏身份
- 过去身份
- 血脉身份
- 伪装身份
- 组织身份
- 契约身份

身份不应塞进 `role` 或自由 JSON。

### Relationship

角色与其他实体之间的连接统一通过 `Relationship` 承载。

典型关系包括：

- 角色与角色：朋友、敌人、亲属、师徒、恋人、盟友、宿敌。
- 角色与地点：出生于、成长于、居住于、当前位于、被封印于、活动于。
- 角色与势力：成员、领袖、创立者、卧底、背叛、敌对、盟友。
- 角色与宠物 / 灵兽：主人、伙伴、契约对象、坐骑、守护者、召唤者。
- 角色与物种：属于某物种、拥有某血脉。
- 角色与道具：拥有、使用、寻找、失去。
- 角色与能力 / 功法：修炼、掌握、失去、被封印。

## 推荐字段

### Character

P1 推荐字段：

| 字段 | 中文说明 |
|---|---|
| `id` | 角色 ID |
| `projectId` | 所属小说项目 ID |
| `name` | 角色名称 |
| `kind` | 角色种类 / 存在类型，例如人类、灵兽、妖族、器灵、AI 生命 |
| `role` | 叙事定位，例如主角、反派、配角、宠物、坐骑 |
| `lifeStatus` | 生存 / 存在状态，例如存活、死亡、失踪、封印、灵体 |
| `appearance` | 外貌 / 形态描写 |
| `personality` | 性格特点 |
| `motivation` | 核心动机 |
| `background` | 背景经历 |
| `voiceStyle` | 说话 / 表达风格 |
| `arc` | 成长线 / 变化线 |
| `importance` | 重要度，用于 Context Builder 排序 |
| `canonStatus` | 正史状态：draft / confirmed / archived |
| `currentState` | 当前状态缓存，不替代 CharacterState 历史 |
| `sourceType` | 来源类型，例如 user / generation_task / imported / chapter_summary |
| `sourceId` | 来源记录 ID |
| `createdAt` | 创建时间 |
| `updatedAt` | 更新时间 |
| `deletedAt` | 软删除时间 |

P1 不建议加入：

- `birthPlaceId`
- `factionId`
- `petOwnerId`
- `speciesId`
- `relationshipMap` 的正式编辑能力

这些都应通过 `Relationship` 表达。

### CharacterState

P1 推荐字段：

| 字段 | 中文说明 |
|---|---|
| `id` | 状态记录 ID |
| `projectId` | 所属小说项目 ID |
| `characterId` | 对应角色 ID |
| `chapterId` | 关联章节 ID，可为空 |
| `stage` | 状态阶段，例如 before_chapter / after_chapter / manual / imported |
| `orderIndex` | 排序值 |
| `location` | 所在位置文本缓存 |
| `physicalState` | 身体状态 |
| `emotionalState` | 情绪状态 |
| `goal` | 当前目标 |
| `knownSecrets` | 已知秘密，P1 可用 Json，长期可沉淀到 Fact / Foreshadowing |
| `relationshipChanges` | 阶段性关系变化，P1 可用 Json，长期由 Relationship 承载 |
| `statusNote` | 状态备注 |
| `sourceType` | 来源类型 |
| `sourceId` | 来源记录 ID |
| `createdAt` | 创建时间 |
| `updatedAt` | 更新时间 |

### CharacterIdentity

P1 推荐字段：

| 字段 | 中文说明 |
|---|---|
| `id` | 身份 ID |
| `projectId` | 所属小说项目 ID |
| `characterId` | 对应角色 ID |
| `title` | 身份名称 |
| `description` | 身份说明 |
| `type` | 身份类型，例如公开身份、隐藏身份、过去身份、血脉身份 |
| `isPublic` | 是否公开 |
| `startsAt` | 身份开始时间描述 |
| `endsAt` | 身份结束时间描述 |
| `importance` | 重要度 |
| `canonStatus` | 正史状态 |
| `sourceType` | 来源类型 |
| `sourceId` | 来源记录 ID |
| `createdAt` | 创建时间 |
| `updatedAt` | 更新时间 |
| `deletedAt` | 软删除时间 |

### Relationship 增强建议

当前 `Relationship` 已有通用关系能力。为支持人物与地点、势力、宠物、物种、道具和能力之间的复杂连接，建议增强：

| 字段 | 中文说明 |
|---|---|
| `importance` | 关系重要度，用于 Context Builder 排序 |
| `isCurrent` | 关系是否当前有效 |
| `startsAt` | 关系开始时间描述 |
| `endsAt` | 关系结束时间描述 |
| `direction` | 关系方向，例如 directed / bidirectional |
| `evidenceType` | 关系来源类型，避免与 sourceType/sourceId 实体端点命名冲突 |
| `evidenceId` | 关系来源记录 ID |

## 宠物 / 灵兽 / 生物规则

1. 具名宠物、灵兽、坐骑、使魔、器灵、妖兽等，只要有剧情连续性，都作为 `Character`。
2. 物种、种族、生物类型等设定后续应归入 `Species` 一等实体；历史上可能存在的 `WorldItem(type=species)` 仅作为过渡兼容，不应继续扩大。
3. 宠物与主人、契约者、伙伴、坐骑关系通过 `Relationship` 表达。
4. 不允许在 `Character` 上增加 `petOwnerId` 这类单一外键。
5. 不允许用自由 JSON 替代宠物 / 物种 / 主人关系。

示例：

```txt
Character: 小白
Species: 九尾灵狐
Relationship: 小白 -- belongs_to_species --> 九尾灵狐
Relationship: 小白 -- companion_of --> 林玄
Relationship: 小白 -- contracted_to --> 林玄
Relationship: 小白 -- born_in --> 青丘秘境
```

## AI 生成与 Context Builder 规则

人物相关 API 必须遵守 `docs/development/entity-api-principles.md`：人物、状态、身份和关系的基础 CRUD 不是普通后台 CRUD，而要同时服务手动编辑、AI 草稿、Context Builder 聚合读取、批量编排和可重试错误处理。

1. AI 生成的角色、身份、关系、状态默认进入 `draft`，不直接写入 `confirmed`。
2. AI 生成结果必须带来源追踪，例如 `sourceType = generation_task`、`sourceId = taskId`。
3. 用户确认后，相关实体才可以切换为 `confirmed`。
4. Context Builder 读取角色时，应聚合：
   - `Character` 基础档案
   - 最新 `CharacterState`
   - `CharacterIdentity[]`
   - confirmed `Relationship[]`
   - 相关 `Location` / `Faction` / `Species` / `StoryItem` / `WorldRule` / `WorldItem`
   - 相关 `Fact[]`
5. Context Builder 默认优先读取 `confirmed`，并按 `importance` 排序。
6. `Character.currentState` 只能作为缓存，不得替代 `CharacterState` 历史。
7. `relationshipMap` 仅作为历史兼容或临时缓存，不作为正式关系来源。

建议内部上下文结构：

```ts
type CharacterContext = {
  character: Character;
  identities: CharacterIdentity[];
  latestState?: CharacterState;
  relationships: Relationship[];
  relatedWorldEntities: Array<Location | Faction | Species | StoryItem | WorldRule | WorldItem>;
  facts: Fact[];
};
```

## 开发规则

1. 角色档案和角色状态必须分离。
2. `Character.currentState` 可以作为当前状态缓存，但不能替代 `CharacterState` 历史。
3. 角色进入 Context Builder 时，应同时考虑角色档案、最近状态、身份和关系。
4. 角色关系不塞进自由文本，长期由 `Relationship` 承载。
5. 多身份不塞进 `role` 或 JSON，使用 `CharacterIdentity`。
6. 出生地、成长地、当前所在地、所属势力、宠物主人、物种关系都通过 `Relationship` 表达。
7. 具名宠物、灵兽、坐骑、器灵等叙事个体归入 `Character`。
8. 物种、种族、生物类型后续归入 `Species` 一等实体；历史 `WorldItem(type=species)` 仅作为过渡兼容。
9. 不允许为了 MVP 用自由 JSON 替代核心关系。
10. 本模块不负责模型调用、AI 生成执行、Prompt 拼接或复杂 UI 实现。
