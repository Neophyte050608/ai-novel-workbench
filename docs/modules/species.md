# Species 模块

## 状态说明

本文记录当前已确认的 `Species` 模块设计。本文只说明文档层面的设计约定，不表示 schema、API 或 UI 已实现；本次更新不修改 schema，不生成 migration，不实现 API/UI。

## 模块定位

`Species` 用于描述小说项目中的物种、种族、生物类型和血脉族群。

`Species` 描述具有共同生物特征、血脉特征、族群身份、繁衍方式、天赋能力或存在形态的群体设定。例如：人类、妖族、精灵、兽人、机械生命、灵兽、魔物、异形、星际种族、特定血脉族群、亚种和变异种。

`Species` 描述群体性设定。具名且有剧情连续性的个体仍然是 `Character`，即使它不是人类。

## 核心实体

- `Species`
- `SpeciesTrait`
- `SpeciesAbility`
- `SpeciesRule`

## 实体职责边界

### Species

`Species` 描述一个物种、种族、生物类型或血脉族群的稳定档案。

负责：

- 物种名称、别名和层级关系。
- 物种类型、叙事定位、稀有度和存在状态。
- 外貌、寿命、繁衍方式和社会结构等群体设定。
- 与来源、正史状态、可见性和重要度有关的元信息。

不负责：

- 具名个体。具名个体归入 `Character`。
- 角色是否属于该物种。该关系由 `Relationship` 表达。
- 栖息地、起源地、势力归属、道具绑定等实体连接。P1 由 `Relationship` 表达。
- 物种规则本体。规则本体进入 `WorldRule`，再通过 `SpeciesRule` 关联。
- 阶段性数量、分布和状态快照。P1 不做 `SpeciesState`。

### SpeciesTrait

`SpeciesTrait` 描述物种的被动特征、稳定特征或常见差异。

负责：

- 生理特征、外貌特征、血脉特征、习性、弱点、文化倾向等描述。
- 该特征是否可遗传、是否常见、重要度和正史状态。
- 不需要主动发动、不需要触发流程、只作为存在事实的特征。

不负责：

- 需要使用、触发或产生明确效果的能力。此类内容归入 `SpeciesAbility`。
- RPG 技能数值、等级成长和战斗公式。
- 角色个体的当前状态或个体差异。具名个体差异归入 `Character`、`CharacterState` 或关系说明。

### SpeciesAbility

`SpeciesAbility` 描述物种具有的叙事能力、天赋能力或可触发能力。

负责：

- 能力名称、别名、类型和叙事描述。
- 能力效果、代价、限制、条件、继承方式和觉醒条件。
- 能力是否常见、是否可遗传、是否唯一，以及重要度和正史状态。

不负责：

- 被动存在且不需要发动的特征。此类内容归入 `SpeciesTrait`。
- RPG 技能表。`SpeciesAbility` 不做 `damage`、`cooldown`、`manaCost`、`level`、`range`、`duration` 等数值技能字段。
- 能力规则本体。规则本体进入 `WorldRule`，必要时通过 `SpeciesRule` 与物种关联。
- 个体角色是否掌握该能力。P1 通过 `Relationship` 或角色相关说明表达，不做 `CharacterSpecies` 或 `SpeciesAbilityRule`。

### SpeciesRule

`SpeciesRule` 描述 `Species` 与 `WorldRule` 的关联。

负责：

- 指出某物种受哪条世界规则约束、继承、例外、强化或限制。
- 记录该规则关系是否主要、执行强度、备注和排序。
- 支持 Context Builder 将物种档案与世界规则一起读入。

不负责：

- 规则正文。规则正文归入 `WorldRule`。
- 角色个体的规则豁免。个体关系和例外通过 `Relationship` 或 `WorldRule` 的相关关系表达。
- 能力专属规则表。P1 不做 `SpeciesAbilityRule`。

## 推荐字段

### Species 字段

| 字段 | 中文说明 |
|---|---|
| `id` | 物种 ID。 |
| `projectId` | 所属小说项目 ID。 |
| `parentId` | 父级物种 ID，用于表达亚种、分支血脉或派生族群。 |
| `name` | 物种名称。 |
| `aliases` | 物种别名、俗称、古称或外族称呼。 |
| `speciesType` | 物种类型，例如 humanoid、beast、spirit、machine、monster。 |
| `narrativeRole` | 叙事定位，例如主文明、敌对族群、守护族群、传说存在。 |
| `summary` | 简短摘要，供列表和 Context Builder 快速读取。 |
| `description` | 物种完整描述。 |
| `appearance` | 典型外貌、形态、体型、标志性特征。 |
| `lifespan` | 寿命、生命周期或存在周期。 |
| `reproduction` | 繁衍方式、传承方式或诞生机制。 |
| `socialStructure` | 社会结构、群体组织、等级制度或族群关系。 |
| `rarity` | 稀有度，用于描述常见、罕见、唯一等出现频率。 |
| `status` | 存在状态，例如繁盛、衰落、濒危、灭绝、隐藏。 |
| `visibility` | 对世界内角色或读者的可见性，例如公开、隐秘、传说。 |
| `importance` | 重要度，用于 Context Builder 排序和筛选。 |
| `canonStatus` | 正史状态，例如 draft、confirmed、archived。 |
| `orderIndex` | 手动排序值。 |
| `sourceType` | 来源类型，例如 user、generation_task、imported、chapter_summary。 |
| `sourceId` | 来源记录 ID。 |
| `createdAt` | 创建时间。 |
| `updatedAt` | 更新时间。 |
| `deletedAt` | 软删除时间。 |

### SpeciesTrait 字段

| 字段 | 中文说明 |
|---|---|
| `id` | 特征 ID。 |
| `projectId` | 所属小说项目 ID。 |
| `speciesId` | 所属物种 ID。 |
| `traitType` | 特征类型，例如 physical、bloodline、behavior、weakness、culture。 |
| `name` | 特征名称。 |
| `summary` | 特征简短摘要。 |
| `description` | 特征完整描述。 |
| `isInheritable` | 是否可遗传或可通过血脉传承。 |
| `isCommon` | 是否为该物种常见特征。 |
| `importance` | 重要度，用于 Context Builder 排序和筛选。 |
| `canonStatus` | 正史状态，例如 draft、confirmed、archived。 |
| `sourceType` | 来源类型。 |
| `sourceId` | 来源记录 ID。 |
| `createdAt` | 创建时间。 |
| `updatedAt` | 更新时间。 |
| `deletedAt` | 软删除时间。 |

### SpeciesAbility 字段

| 字段 | 中文说明 |
|---|---|
| `id` | 能力 ID。 |
| `projectId` | 所属小说项目 ID。 |
| `speciesId` | 所属物种 ID。 |
| `name` | 能力名称。 |
| `aliases` | 能力别名、俗称、古称或不同文化中的称呼。 |
| `abilityType` | 能力类型，例如 innate、bloodline、active、passive_effect、transformation。 |
| `summary` | 能力简短摘要。 |
| `description` | 能力完整描述。 |
| `effect` | 能力产生的叙事效果。 |
| `cost` | 使用或觉醒能力需要付出的代价。 |
| `limitation` | 能力限制、弱点、禁忌或不可用场景。 |
| `condition` | 使用、触发或生效条件。 |
| `inheritanceType` | 继承方式，例如 genetic、bloodline、ritual、non_inheritable。 |
| `awakeningCondition` | 觉醒条件或显现条件。 |
| `masteryNotes` | 掌握、熟练、失控或训练相关说明；字段名为 `masteryNotes`，不是 `masteryLevel`。 |
| `isCommon` | 是否为该物种常见能力。 |
| `isInheritable` | 是否可遗传或可传承。 |
| `isUnique` | 是否为唯一能力或极少数个体才可能拥有。 |
| `visibility` | 能力对世界内角色或读者的可见性。 |
| `importance` | 重要度，用于 Context Builder 排序和筛选。 |
| `canonStatus` | 正史状态，例如 draft、confirmed、archived。 |
| `sourceType` | 来源类型。 |
| `sourceId` | 来源记录 ID。 |
| `createdAt` | 创建时间。 |
| `updatedAt` | 更新时间。 |
| `deletedAt` | 软删除时间。 |

### SpeciesRule 字段

| 字段 | 中文说明 |
|---|---|
| `id` | 物种规则关联 ID。 |
| `projectId` | 所属小说项目 ID。 |
| `speciesId` | 所属物种 ID。 |
| `worldRuleId` | 关联的世界规则 ID。 |
| `relationType` | 物种与规则的关系类型，例如 governed_by、exception_to、amplified_by、limited_by。 |
| `isPrimary` | 是否为该物种的主要规则关联。 |
| `enforcementLevel` | 规则执行强度或约束强度。 |
| `notes` | 关联备注，说明适用范围、例外或叙事用法。 |
| `orderIndex` | 手动排序值。 |
| `createdAt` | 创建时间。 |
| `updatedAt` | 更新时间。 |

## 建议值

### `speciesType`

- `human`：人类或人类分支。
- `humanoid`：类人种族。
- `beast`：兽类、灵兽或动物型生命。
- `spirit`：灵体、元素生命或非实体生命。
- `monster`：魔物、异形、怪物类生命。
- `machine`：机械生命、AI 生命或构装体族群。
- `deity`：神性族群或高位存在类型。
- `undead`：亡灵、不死族或死后存在形态。
- `hybrid`：混血、融合种或人工改造种。
- `other`：其他类型。

### `narrativeRole`

- `protagonist_group`：主角所属族群或主要视角族群。
- `antagonist_group`：敌对族群或主要冲突来源。
- `ally_group`：盟友族群。
- `neutral_group`：中立族群。
- `ancient_race`：远古族群。
- `hidden_race`：隐藏族群。
- `guardian_race`：守护族群。
- `mythic_being`：神话或传说存在。
- `background_species`：背景物种。

### `status`

- `thriving`：繁盛。
- `stable`：稳定存在。
- `declining`：衰落。
- `endangered`：濒危。
- `extinct`：灭绝。
- `hidden`：隐藏于世界认知之外。
- `sealed`：被封印。
- `unknown`：状态未知。

### `rarity`

- `common`：常见。
- `uncommon`：不常见。
- `rare`：稀有。
- `very_rare`：极稀有。
- `legendary`：传说级。
- `unique`：唯一。
- `unknown`：未知。

### `traitType`

- `physical`：生理或外貌特征。
- `bloodline`：血脉特征。
- `behavior`：行为习性。
- `sense`：感知特征。
- `weakness`：弱点或缺陷。
- `resistance`：抗性或适应性。
- `culture`：文化倾向或族群习俗。
- `reproduction`：繁衍相关特征。
- `lifespan`：寿命或生命周期特征。
- `social`：社会结构相关特征。

### `abilityType`

- `innate`：天生能力。
- `bloodline`：血脉能力。
- `active`：需要主动使用的能力。
- `triggered`：满足条件后触发的能力。
- `transformation`：变身、形态变化或进化能力。
- `sense`：特殊感知能力。
- `movement`：移动、穿梭或迁徙能力。
- `resonance`：共鸣、契约或连接能力。
- `creation`：创造、孕育或构造能力。
- `curse`：诅咒、污染或负面能力。

### `inheritanceType`

- `genetic`：普通遗传。
- `bloodline`：血脉传承。
- `maternal`：母系传承。
- `paternal`：父系传承。
- `ritual`：仪式传承。
- `contract`：契约传承。
- `awakening`：个体觉醒。
- `environmental`：环境影响产生。
- `non_inheritable`：不可遗传。
- `unknown`：未知。

### `SpeciesRule.relationType`

- `governed_by`：受该规则约束。
- `exception_to`：是该规则的例外。
- `amplified_by`：被该规则强化。
- `limited_by`：被该规则限制。
- `created_by`：由该规则产生或定义。
- `required_by`：存在或行动依赖该规则。
- `violates`：违背该规则。
- `modifies`：会改变该规则的适用方式。

### `enforcementLevel`

- `soft`：软约束，可被情节、条件或例外绕开。
- `normal`：常规约束，默认生效。
- `strict`：强约束，违反会造成明显后果。
- `absolute`：绝对约束，几乎不可违背。
- `unknown`：未知或尚未确认。

## 边界规则

1. 具名个体是 `Character`，不是 `Species`。
2. P1 不在 `Character` 上加 `speciesId` 或 `raceId`。
3. `Character` 与 `Species` 的关系走 `Relationship`。
4. `Species` 与 `Location`、`Faction`、`StoryItem`、`WorldItem` 的关系，P1 走 `Relationship`。
5. P1 不做 `SpeciesLocation`、`SpeciesState`、`SpeciesFaction`、`CharacterSpecies`、`SpeciesAbilityRule`。
6. 被动存在、不需要发动的是 `SpeciesTrait`；需要使用、触发或产生效果的是 `SpeciesAbility`。
7. `SpeciesAbility` 是叙事能力描述，不是 RPG 技能表；不做 `damage`、`cooldown`、`manaCost`、`level`、`range`、`duration` 等数值技能字段。
8. 物种规则本体进入 `WorldRule`，通过 `SpeciesRule` 关联。
9. 历史上可能存在的 `WorldItem(type=species)` 仅作为过渡兼容，不应继续扩大。
10. 不允许用自由 JSON 替代核心关系。

## Relationship 关系建议

以下关系由 `Relationship` 承载：

- `Character` 属于某 `Species`。
- `Character` 拥有某 `Species` 血脉。
- `Species` 起源于、栖息于、迁徙至或被封印于某 `Location`。
- `Species` 隶属、敌对、依附或创建某 `Faction`。
- `Species` 与 `StoryItem` 存在绑定、克制、依赖或传承关系。
- `Species` 与 `WorldItem` 中的体系、制度、历史背景或文化设定有关。

## Context Builder 读取原则

Context Builder 读取 `Species` 时，应遵守以下原则：

1. 默认只读取 `canonStatus = confirmed` 的记录。
2. 排除已软删除记录，即 `deletedAt` 不为空的记录不进入上下文。
3. 按 `importance` 排序，优先注入高重要度物种和高重要度特征、能力、规则。
4. 结合 `visibility` 判断是否可对当前视角、角色或读者公开。
5. 结合 `status` 判断物种当前存在状态，例如隐藏、灭绝、封印或繁盛。
6. 聚合 `Species`、`SpeciesTrait`、`SpeciesAbility`、`SpeciesRule`。
7. 通过 `Relationship` 聚合相关角色、地点、势力、道具和世界设定。
8. `SpeciesRule` 只提供物种与规则的关联；规则正文从 `WorldRule` 读取。
9. `SpeciesAbility` 进入上下文时保留叙事说明、条件、代价和限制，不转换为数值技能。

建议内部上下文结构：

```ts
type SpeciesContext = {
  species: Species;
  traits: SpeciesTrait[];
  abilities: SpeciesAbility[];
  rules: Array<{
    link: SpeciesRule;
    worldRule: WorldRule;
  }>;
  relationships: Relationship[];
  relatedCharacters: Character[];
  relatedLocations: Location[];
  relatedFactions: Faction[];
  relatedStoryItems: StoryItem[];
  relatedWorldItems: WorldItem[];
};
```

## 示例：九尾灵狐

```txt
Species: 九尾灵狐
speciesType: beast
narrativeRole: mythic_being
rarity: legendary
status: hidden
visibility: legend
importance: 90
canonStatus: confirmed
summary: 青丘秘境中传承千年的灵狐族群，九尾象征血脉成熟与天命觉醒。

SpeciesTrait:
- name: 九尾血脉
  traitType: bloodline
  isInheritable: true
  isCommon: false
  summary: 少数族人出生时带有九尾血脉，尾数会随修行和劫数增长。

SpeciesTrait:
- name: 畏惧破邪雷火
  traitType: weakness
  isInheritable: true
  isCommon: true
  summary: 灵狐血脉容易被破邪雷火压制，重伤时会显露原形。

SpeciesAbility:
- name: 幻心术
  aliases: [狐幻, 灵狐幻境]
  abilityType: active
  inheritanceType: bloodline
  effect: 制造影响感知和情绪的幻境。
  cost: 长时间维持会消耗灵识。
  limitation: 对心志坚定者效果减弱。
  condition: 需要与目标建立视线或气息连接。
  awakeningCondition: 通常在第三尾觉醒后稳定使用。
  masteryNotes: 幼年灵狐容易失控，成年后可精细操控幻境边界。

WorldRule: 血脉越接近天狐，越容易被天劫锁定。
SpeciesRule:
- relationType: governed_by
  enforcementLevel: strict
  isPrimary: true
  notes: 九尾灵狐每次尾数突破都会提高天劫风险。

Relationship:
- 小白 -- belongs_to_species --> 九尾灵狐
- 九尾灵狐 -- inhabits --> 青丘秘境
- 九尾灵狐 -- protected_by --> 青丘狐族
- 九尾灵狐 -- bound_to --> 天狐玉佩
```

在此示例中，`九尾灵狐` 是 `Species`；具名灵狐 `小白` 是 `Character`。`幻心术` 是需要使用并产生效果的 `SpeciesAbility`；`九尾血脉` 和 `畏惧破邪雷火` 是被动存在的 `SpeciesTrait`。天劫规则正文进入 `WorldRule`，`SpeciesRule` 只记录九尾灵狐与该规则的关系。

## 开发规则

1. 本设计不代表 schema、API 或 UI 已实现。
2. 实现前必须另行确认 schema 变更、migration、API 合约和 UI 交互。
3. P1 优先保证 `Species` 与 `Relationship`、`WorldRule`、Context Builder 的边界清晰。
4. 不为了快速实现增加 `Character.speciesId`、`Character.raceId` 或其他单一物种外键。
5. 不把叙事能力建模成 RPG 数值技能表。
