# Locations 模块

## 状态说明

本文记录当前已确认的 `Location` 设计。本文只描述文档层设计，不表示 schema、API 或 UI 已实现；本次更新也不修改 schema，不生成 migration，不实现 API/UI。

## 模块定位

`Location` 表示小说项目中的空间实体。地点是可被角色到达、事件发生、势力占据、规则作用的空间实体。

地点可以是国家、城市、宗门、建筑、房间、洞府、遗迹、禁地、秘境、星球、维度、虚拟空间等。地点应具备相对稳定的空间身份，并能参与剧情、势力、规则和上下文构建。

## 核心实体

Location 模块包含四个核心实体：

- `Location`：地点主档案。
- `LocationState`：地点在特定章节或阶段的状态快照。
- `LocationRule`：地点与世界规则的专属关联。
- `LocationFaction`：地点与势力的占据、控制或影响关系。

## 实体职责边界

### Location

`Location` 负责记录地点的稳定身份和基础设定，包括名称、类型、层级、叙事功能、环境、氛围、地形、气候、进入规则、危险程度、可见性和正典状态。

`Location` 不负责：

- 不负责章节内临时状态变化；这些由 `LocationState` 记录。
- 不负责地点与世界规则的多对多关系；这些由 `LocationRule` 记录。
- 不负责地点与势力的占据、控制、影响关系；这些由 `LocationFaction` 记录。
- 不负责角色当前所在地、道具存放地、物种栖息地等低频关系；这些先由 `Relationship` 记录。
- 不负责抽象世界体系、文化制度、历史背景；这些归入 `WorldItem`。
- 不负责势力组织本身；这些归入 `Faction`。

### LocationState

`LocationState` 负责记录地点在某章节、阶段或叙事时间点的变化状态，例如封印解除、危险升级、环境改变、控制权变化摘要、事件影响和临时可见性。

`LocationState` 不负责：

- 不负责地点的稳定基础档案；这些保留在 `Location`。
- 不负责替代章节正文、章节计划或事件表。
- 不负责直接表达势力关系；势力关系仍由 `LocationFaction` 管理，`controlSummary` 只写状态摘要。
- 不负责改写正典结论；它只记录特定阶段的状态信息。

### LocationRule

`LocationRule` 负责记录某地点受到哪些世界规则作用，以及规则在该地点的作用类型、主次关系和执行强度。

`LocationRule` 不负责：

- 不负责规则本体内容；规则本体由 `WorldRule` 管理。
- 不负责地点基础档案；这些由 `Location` 管理。
- 不负责角色、道具、物种与规则的低频关系；这些先由 `Relationship` 记录。
- 不负责规则引擎或一致性校验实现。

### LocationFaction

`LocationFaction` 负责记录地点与势力之间的控制、占据、管辖、影响、争夺等关系，并支持当前关系、起止时间、影响程度和正典状态。

`LocationFaction` 不负责：

- 不负责势力档案；这些由 `Faction` 管理。
- 不负责地点档案；这些由 `Location` 管理。
- 不负责所有角色成员关系；角色与势力关系由对应关系设计承载。
- 不负责替代 `LocationState`；地点状态变化仍记录在 `LocationState`。

## Location 字段

| 字段 | 中文说明 |
| --- | --- |
| `id` | 地点唯一标识。 |
| `projectId` | 所属项目标识。 |
| `parentId` | 父级地点标识，用于地点层级；为空表示顶层地点。 |
| `name` | 地点名称。 |
| `aliases` | 地点别名、俗称、旧称或外文名。 |
| `locationType` | 地点类型，例如宗门、城市、禁地、秘境、建筑、房间。 |
| `narrativeRole` | 叙事角色，说明地点在故事中的功能。 |
| `summary` | 地点简述，用于列表和上下文摘要。 |
| `description` | 地点详细描述。 |
| `environment` | 环境特征，例如灵气浓度、污染、生态、光照。 |
| `atmosphere` | 氛围感受，例如肃杀、神圣、荒凉、繁华。 |
| `terrain` | 地形或空间结构，例如山谷、地下、浮岛、宫殿群。 |
| `climate` | 气候或长期环境条件，例如寒冷、多雨、永夜。 |
| `accessRule` | 进入条件、通行限制、开放规则或路线说明。 |
| `dangerLevel` | 常态危险程度。 |
| `lifecycleStatus` | 生命周期状态，例如存在、封印、毁灭、废弃。 |
| `visibility` | 对读者、角色或上下文构建的可见程度。 |
| `importance` | 重要度，用于排序、检索和 Context Builder 权重。 |
| `canonStatus` | 正典状态，例如已确认、候选、废弃。 |
| `orderIndex` | 手动排序值。 |
| `sourceType` | 来源类型，例如人工创建、AI 生成、导入、章节抽取。 |
| `sourceId` | 来源对象标识，例如章节、生成任务或导入记录。 |
| `createdAt` | 创建时间。 |
| `updatedAt` | 更新时间。 |
| `deletedAt` | 软删除时间；为空表示未删除。 |

## LocationState 字段

| 字段 | 中文说明 |
| --- | --- |
| `id` | 地点状态唯一标识。 |
| `projectId` | 所属项目标识。 |
| `locationId` | 对应地点标识。 |
| `chapterId` | 对应章节标识；为空时可表示非章节绑定的阶段状态。 |
| `stage` | 状态所属阶段，例如开篇、中期、大战后、终章。 |
| `orderIndex` | 同一地点或阶段内的排序值。 |
| `lifecycleStatus` | 该阶段的生命周期状态。 |
| `dangerLevel` | 该阶段的危险程度。 |
| `accessRule` | 该阶段的进入规则或通行限制。 |
| `visibility` | 该阶段的可见程度。 |
| `environmentChanges` | 环境变化说明。 |
| `controlSummary` | 控制权或占据情况摘要；详细势力关系仍看 `LocationFaction`。 |
| `eventSummary` | 与该地点状态有关的事件摘要。 |
| `stateNote` | 状态备注、例外和补充说明。 |
| `sourceType` | 来源类型，例如人工创建、AI 生成、章节抽取。 |
| `sourceId` | 来源对象标识。 |
| `createdAt` | 创建时间。 |
| `updatedAt` | 更新时间。 |

## LocationRule 字段

| 字段 | 中文说明 |
| --- | --- |
| `id` | 地点规则关系唯一标识。 |
| `projectId` | 所属项目标识。 |
| `locationId` | 对应地点标识。 |
| `worldRuleId` | 对应世界规则标识。 |
| `relationType` | 地点与规则的关系类型。 |
| `isPrimary` | 是否为该地点的主要规则。 |
| `enforcementLevel` | 规则在该地点的执行强度或约束强度。 |
| `notes` | 关系备注、例外或解释。 |
| `orderIndex` | 排序值。 |
| `createdAt` | 创建时间。 |
| `updatedAt` | 更新时间。 |

## LocationFaction 字段

| 字段 | 中文说明 |
| --- | --- |
| `id` | 地点势力关系唯一标识。 |
| `projectId` | 所属项目标识。 |
| `locationId` | 对应地点标识。 |
| `factionId` | 对应势力标识。 |
| `relationType` | 地点与势力的关系类型。 |
| `influenceLevel` | 势力在该地点的影响程度。 |
| `isCurrent` | 是否为当前有效关系。 |
| `startsAt` | 关系开始时间、章节或阶段。 |
| `endsAt` | 关系结束时间、章节或阶段。 |
| `notes` | 关系备注、争议、限制或补充说明。 |
| `canonStatus` | 正典状态，例如已确认、候选、废弃。 |
| `sourceType` | 来源类型，例如人工创建、AI 生成、章节抽取。 |
| `sourceId` | 来源对象标识。 |
| `createdAt` | 创建时间。 |
| `updatedAt` | 更新时间。 |
| `deletedAt` | 软删除时间；为空表示未删除。 |

## 建议值

### locationType

建议值：

- `world`：世界或大世界。
- `continent`：大陆。
- `region`：区域。
- `country`：国家。
- `province`：州郡、省域或行政区。
- `city`：城市。
- `town`：镇、村、聚落。
- `sect`：宗门驻地。
- `base`：据点、营地、总部。
- `building`：建筑。
- `room`：房间。
- `landmark`：地标。
- `wilderness`：荒野、山林、沙漠、海域。
- `secret_realm`：秘境、小世界。
- `ruin`：遗迹。
- `forbidden_area`：禁地。
- `dimension`：维度、异空间。
- `virtual_space`：虚拟空间。
- `other`：其他。

### narrativeRole

建议值：

- `main_stage`：主要舞台。
- `home_base`：主角或核心团体据点。
- `origin`：起源地。
- `destination`：目标地点。
- `trial_ground`：试炼场。
- `conflict_zone`：冲突区域。
- `mystery_site`：谜团地点。
- `resource_site`：资源产地。
- `prison`：囚禁地点。
- `battlefield`：战场。
- `transit`：中转地点。
- `background`：背景地点。

### dangerLevel

建议值：

- `safe`：安全。
- `low`：低危险。
- `medium`：中等危险。
- `high`：高危险。
- `extreme`：极度危险。
- `forbidden`：禁入级危险。
- `unknown`：危险未知。

### lifecycleStatus

建议值：

- `active`：正常存在并可使用。
- `hidden`：隐藏或未公开。
- `sealed`：被封印。
- `restricted`：受限制开放。
- `occupied`：被占据。
- `contested`：争夺中。
- `damaged`：受损。
- `destroyed`：毁灭。
- `abandoned`：废弃。
- `lost`：失落或位置不明。

### visibility

建议值：

- `public`：公开可见。
- `known_to_main_cast`：主角团已知。
- `known_to_some`：少数角色已知。
- `secret`：秘密。
- `foreshadowed`：仅伏笔呈现。
- `hidden_from_reader`：暂不向读者揭示。

### LocationRule.relationType

建议值：

- `applies_to`：规则适用于该地点。
- `originates_from`：规则源自该地点。
- `amplified_in`：规则在该地点被增强。
- `weakened_in`：规则在该地点被削弱。
- `suppressed_in`：规则在该地点被压制。
- `exception_in`：该地点是规则例外。
- `required_for_access`：规则是进入该地点的条件。
- `violated_by_entry`：进入该地点会触犯规则。

### enforcementLevel

建议值：

- `none`：不执行或仅作背景说明。
- `weak`：弱约束。
- `normal`：常规约束。
- `strong`：强约束。
- `absolute`：绝对约束。
- `variable`：随条件变化。

### LocationFaction.relationType

建议值：

- `controls`：控制。
- `occupies`：占据。
- `governs`：管辖。
- `owns`：拥有。
- `guards`：守护。
- `uses_as_base`：作为据点使用。
- `influences`：影响。
- `contests`：争夺。
- `invades`：入侵。
- `allied_access`：盟友通行或使用。
- `forbidden_from`：被禁止进入。
- `formerly_controlled`：曾经控制。

## 关系规则

- 地点层级用 `Location.parentId` 表达。
- 地点专属规则用 `LocationRule` 表达。
- 地点与势力关系用 `LocationFaction` 表达。
- `Character`、`StoryItem`、`Species` 与 `Location` 的低频关系先用 `Relationship` 表达。
- 不在 `Location` 上放 `ownerFactionId`、`currentCharacterIds`、`ruleIds`、`itemIds`、`speciesIds`。

## Context Builder 读取原则

Context Builder 读取地点信息时，应优先选择：

- `canonStatus` 为 confirmed 的地点和关系。
- `deletedAt` 为空的未删除记录。
- `importance` 较高的地点。
- `visibility` 符合当前视角、读者揭示进度和生成目标的地点。
- `lifecycleStatus` 与当前章节阶段相符的地点。
- 与当前章节、阶段或时间线匹配的 `LocationState`。
- 与地点相关、仍有效且重要的 `LocationRule`。
- 与地点相关、`isCurrent` 为真或时间范围匹配的 `LocationFaction`。

Context Builder 应避免把隐藏信息、废弃设定、已删除记录或未确认候选设定直接注入正文上下文，除非生成任务明确需要。

## 小说示例：青云宗禁地

### Location

- `name`：青云宗禁地
- `aliases`：后山禁地、镇魔谷
- `locationType`：`forbidden_area`
- `narrativeRole`：`mystery_site`
- `summary`：青云宗后山深处的封印之地，镇压着上古魔修残魂。
- `environment`：灵气紊乱，夜间有黑雾渗出。
- `atmosphere`：肃杀、压抑、诡秘。
- `terrain`：山谷、石门、地下封印阵。
- `climate`：常年阴冷，谷底无风。
- `accessRule`：只有掌门令和三位长老共同开启阵门时才能进入。
- `dangerLevel`：`forbidden`
- `lifecycleStatus`：`sealed`
- `visibility`：`foreshadowed`
- `importance`：高
- `canonStatus`：confirmed

### LocationState

- `stage`：宗门大比后
- `lifecycleStatus`：`damaged`
- `dangerLevel`：`extreme`
- `accessRule`：封印裂开后，低阶弟子靠近谷口会被魔气侵蚀。
- `environmentChanges`：黑雾扩散到后山竹林，封印阵出现三道裂痕。
- `controlSummary`：青云宗戒律堂临时封锁入口。
- `eventSummary`：主角追查失踪弟子时发现禁地封印松动。
- `stateNote`：读者只知道封印异常，暂不知道魔修残魂身份。

### LocationRule

- `relationType`：`applies_to`
- `worldRuleId`：镇魔封印规则
- `isPrimary`：true
- `enforcementLevel`：`strong`
- `notes`：进入者修为越低，越容易被魔气诱导产生幻觉。

### LocationFaction

- `factionId`：青云宗
- `relationType`：`guards`
- `influenceLevel`：高
- `isCurrent`：true
- `startsAt`：开篇前一百年
- `notes`：青云宗负责维护封印，并禁止普通弟子接近后山禁地。
- `canonStatus`：confirmed

## 实现状态

本设计只代表当前确认的 Location 文档设计，不代表 schema、API 或 UI 已实现。后续落地时，需要另行设计数据表、迁移、服务接口、校验逻辑和界面交互。
