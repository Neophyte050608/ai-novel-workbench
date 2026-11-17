# Factions 模块

## 状态说明

本文记录当前已确认的 `Faction` 设计。本文只描述文档层设计，不表示 schema、API 或 UI 已实现；本次更新也不修改 schema，不生成 migration，不实现 API/UI。

## 模块定位

`Faction` 表示小说项目中的势力、组织或群体实体。势力 / 组织是拥有共同身份、组织结构、资源、目标或影响力的群体实体。

典型例子包括宗门、门派、家族、帮会、公会、国家、军队、政府机构、联盟、阵营、公司、研究所、学院、教会、秘密组织、反派组织、地下网络和临时同盟。

`Faction` 关注“组织作为一个叙事实体”的稳定身份、目标、结构、资源、状态与影响力，并通过专门关系实体连接角色、规则、地点和其他势力。

## 核心实体

Faction 模块包含五个核心实体：

- `Faction`：势力主档案。
- `FactionState`：势力在特定章节或阶段的状态快照。
- `FactionMembership`：角色与势力的结构化成员关系。
- `FactionRelation`：势力与势力之间的结构化关系。
- `FactionRule`：势力与世界规则的专属关联。

## 实体职责边界

### Faction

`Faction` 负责记录势力的稳定身份和基础设定，包括名称、别名、类型、叙事功能、理念、目标、组织结构、资源、常态状态、可见性、重要度和正典状态。

`Faction` 不负责：

- 不负责章节内临时状态变化；这些由 `FactionState` 记录。
- 不负责角色成员清单、职务任免和公开 / 隐秘身份；这些由 `FactionMembership` 记录。
- 不负责势力之间的联盟、敌对、附庸、分裂等关系；这些由 `FactionRelation` 记录。
- 不负责势力与世界规则的多对多关系；这些由 `FactionRule` 记录。
- 不负责地点的占据、控制、管辖和影响关系；这些由 Location 模块的 `LocationFaction` 记录。
- 不负责角色个人档案；角色本体由 `Character` 管理。
- 不负责地点本体；地点由 `Location` 管理。
- 不负责抽象制度、文化、历史背景或世界体系本体；这些归入 `WorldItem` 或 `WorldRule`。

### FactionState

`FactionState` 负责记录势力在某章节、阶段或叙事时间点的变化状态，例如实力涨落、影响力变化、资源损耗、内部分裂、名声变化、目标调整、冲突摘要和事件影响。

`FactionState` 不负责：

- 不负责势力的稳定基础档案；这些保留在 `Faction`。
- 不负责替代章节正文、章节计划或事件表。
- 不负责直接表达角色成员关系；成员关系仍由 `FactionMembership` 管理。
- 不负责直接表达势力间结构化关系；势力间关系仍由 `FactionRelation` 管理，`conflictSummary` 只写状态摘要。
- 不负责改写正典结论；它只记录特定阶段的状态信息。

### FactionMembership

`FactionMembership` 负责记录角色与势力之间的结构化成员关系，包括成员类型、职位、等级、部门、是否当前有效、是否公开、起止时间、备注和正典状态。

`FactionMembership` 不负责：

- 不负责角色本体档案、性格、能力、履历等；这些由 `Character` 及相关角色模块管理。
- 不负责势力基础档案；这些由 `Faction` 管理。
- 不负责叙事身份卡；叙事身份由 `CharacterIdentity` 管理。
- 不负责势力与势力关系；这些由 `FactionRelation` 管理。
- 不负责表达一次性互动、偶遇或普通剧情事件；低频或临时关系先由 `Relationship` 或章节内容承载。

### FactionRelation

`FactionRelation` 负责记录两个势力之间的结构化关系，包括联盟、敌对、附庸、竞争、控制、分裂、贸易、停战等关系类型、方向、强度、当前有效性、起止时间、描述和正典状态。

`FactionRelation` 不负责：

- 不负责势力各自的基础档案；这些由 `Faction` 管理。
- 不负责角色与势力的成员关系；这些由 `FactionMembership` 管理。
- 不负责地点控制关系；这些由 `LocationFaction` 管理。
- 不负责替代章节冲突事件；具体事件仍由章节、计划或记忆模块记录。
- 不负责所有低频跨模块关系；`Faction` 与 `StoryItem`、`Species`、`WorldItem`、`Chapter` 的低频关系先用 `Relationship`。

### FactionRule

`FactionRule` 负责记录某势力与某条世界规则之间的关系，包括规则适用、信奉、执行、豁免、违反、利用、维护、对抗等关系类型，以及主次关系、执行强度、备注和排序。

`FactionRule` 不负责：

- 不负责规则本体内容；规则本体由 `WorldRule` 管理。
- 不负责势力基础档案；这些由 `Faction` 管理。
- 不负责规则引擎、自动校验或推理实现。
- 不负责角色、地点、物品、物种与规则的低频关系；这些先由各自专属关系或 `Relationship` 记录。

## Faction 字段

| 字段 | 中文说明 |
| --- | --- |
| `id` | 势力唯一标识。 |
| `projectId` | 所属项目标识。 |
| `parentId` | 父级势力标识，用于势力层级、分支、附属组织或下辖部门；为空表示顶层势力。 |
| `name` | 势力名称。 |
| `aliases` | 势力别名、旧称、外号、简称或外文名。 |
| `factionType` | 势力类型，例如宗门、国家、家族、军队、公司、秘密组织。 |
| `narrativeRole` | 叙事角色，说明势力在故事中的功能。 |
| `summary` | 势力简述，用于列表和上下文摘要。 |
| `description` | 势力详细描述。 |
| `ideology` | 理念、信条、价值观、宗旨或共同身份认同。 |
| `goal` | 核心目标、长期诉求或当前主要目标。 |
| `structure` | 组织结构、等级体系、部门划分或决策方式。 |
| `resources` | 势力掌握的资源，例如财富、兵力、灵脉、技术、情报、人脉。 |
| `status` | 常态状态，例如活跃、衰落、隐藏、解散、被摧毁。 |
| `visibility` | 对读者、角色或上下文构建的可见程度。 |
| `importance` | 重要度，用于排序、检索和 Context Builder 权重。 |
| `canonStatus` | 正典状态，例如已确认、候选、废弃。 |
| `orderIndex` | 手动排序值。 |
| `sourceType` | 来源类型，例如人工创建、AI 生成、导入、章节抽取。 |
| `sourceId` | 来源对象标识，例如章节、生成任务或导入记录。 |
| `createdAt` | 创建时间。 |
| `updatedAt` | 更新时间。 |
| `deletedAt` | 软删除时间；为空表示未删除。 |

## FactionState 字段

| 字段 | 中文说明 |
| --- | --- |
| `id` | 势力状态唯一标识。 |
| `projectId` | 所属项目标识。 |
| `factionId` | 对应势力标识。 |
| `chapterId` | 对应章节标识；为空时可表示非章节绑定的阶段状态。 |
| `stage` | 状态所属阶段，例如开篇、中期、宗门大比后、战争期、终章。 |
| `orderIndex` | 同一势力或阶段内的排序值。 |
| `status` | 该阶段的势力状态。 |
| `powerLevel` | 该阶段的整体实力或权力水平。 |
| `influenceLevel` | 该阶段的影响力范围或影响强度。 |
| `resourceState` | 该阶段的资源状况，例如充足、紧缺、被封锁、损失惨重。 |
| `internalState` | 内部状态，例如团结、内斗、分裂、清洗、改革。 |
| `publicReputation` | 对外名声、公众评价或江湖风评。 |
| `goal` | 该阶段的主要目标或临时目标。 |
| `conflictSummary` | 与其他势力、角色或事件有关的冲突摘要。 |
| `eventSummary` | 导致或体现该状态的事件摘要。 |
| `stateNote` | 状态备注、例外和补充说明。 |
| `sourceType` | 来源类型，例如人工创建、AI 生成、章节抽取。 |
| `sourceId` | 来源对象标识。 |
| `createdAt` | 创建时间。 |
| `updatedAt` | 更新时间。 |

## FactionMembership 字段

| 字段 | 中文说明 |
| --- | --- |
| `id` | 势力成员关系唯一标识。 |
| `projectId` | 所属项目标识。 |
| `factionId` | 对应势力标识。 |
| `characterId` | 对应角色标识。 |
| `membershipType` | 成员关系类型，例如成员、领袖、长老、弟子、卧底、叛徒、盟友代表。 |
| `roleTitle` | 角色在势力中的头衔、职务或公开称号。 |
| `rank` | 等级、阶层、资历或权力排序。 |
| `department` | 所属部门、堂口、派系、军团、办公室或支脉。 |
| `isCurrent` | 是否为当前有效成员关系。 |
| `isPublic` | 该成员关系是否公开；为假时可表示秘密成员、卧底或隐藏身份。 |
| `startsAt` | 成员关系开始时间、章节或阶段。 |
| `endsAt` | 成员关系结束时间、章节或阶段。 |
| `notes` | 关系备注、限制、争议或补充说明。 |
| `canonStatus` | 正典状态，例如已确认、候选、废弃。 |
| `sourceType` | 来源类型，例如人工创建、AI 生成、章节抽取。 |
| `sourceId` | 来源对象标识。 |
| `createdAt` | 创建时间。 |
| `updatedAt` | 更新时间。 |
| `deletedAt` | 软删除时间；为空表示未删除。 |

## FactionRelation 字段

| 字段 | 中文说明 |
| --- | --- |
| `id` | 势力关系唯一标识。 |
| `projectId` | 所属项目标识。 |
| `sourceFactionId` | 关系发起方或源势力标识。 |
| `targetFactionId` | 关系目标方或目标势力标识。 |
| `relationType` | 势力关系类型，例如联盟、敌对、附庸、竞争、分裂、贸易。 |
| `direction` | 关系方向，例如单向、双向、源到目标、目标到源；用于解释非对称关系。 |
| `strength` | 关系强度，例如弱、中、强、绝对或数值权重。 |
| `isCurrent` | 是否为当前有效关系。 |
| `startsAt` | 关系开始时间、章节或阶段。 |
| `endsAt` | 关系结束时间、章节或阶段。 |
| `description` | 关系描述、历史背景、条件或限制。 |
| `canonStatus` | 正典状态，例如已确认、候选、废弃。 |
| `sourceType` | 来源类型，例如人工创建、AI 生成、章节抽取。 |
| `sourceId` | 来源对象标识。 |
| `createdAt` | 创建时间。 |
| `updatedAt` | 更新时间。 |
| `deletedAt` | 软删除时间；为空表示未删除。 |

## FactionRule 字段

| 字段 | 中文说明 |
| --- | --- |
| `id` | 势力规则关系唯一标识。 |
| `projectId` | 所属项目标识。 |
| `factionId` | 对应势力标识。 |
| `worldRuleId` | 对应世界规则标识。 |
| `relationType` | 势力与规则的关系类型。 |
| `isPrimary` | 是否为该势力的主要规则或核心规则。 |
| `enforcementLevel` | 规则在该势力中的执行强度或约束强度。 |
| `notes` | 关系备注、例外或解释。 |
| `orderIndex` | 排序值。 |
| `createdAt` | 创建时间。 |
| `updatedAt` | 更新时间。 |

## 建议值

### factionType

建议值：

- `sect`：宗门、门派、修行组织。
- `clan`：氏族、家族、血脉共同体。
- `guild`：公会、行会、职业组织。
- `gang`：帮会、地下团伙。
- `nation`：国家、王朝、政权。
- `government`：政府机构、官署、行政组织。
- `military`：军队、军团、武装组织。
- `alliance`：联盟、同盟、联合阵营。
- `company`：公司、商会、企业。
- `academy`：学院、学校、研究教育组织。
- `research_institute`：研究所、实验室、技术组织。
- `religion`：教会、神殿、信仰组织。
- `cult`：邪教、禁忌信仰组织。
- `secret_society`：秘密组织、隐秘社团。
- `rebellion`：叛军、革命组织、反抗军。
- `criminal_network`：犯罪网络、黑市组织。
- `temporary_coalition`：临时同盟或短期联合体。
- `other`：其他。

### narrativeRole

建议值：

- `protagonist_side`：主角阵营或主角长期依附势力。
- `antagonist_side`：反派阵营或主要对立势力。
- `mentor_group`：导师、庇护或训练组织。
- `rival_group`：竞争者或对照组势力。
- `neutral_power`：中立大势力。
- `hidden_power`：隐藏势力或幕后组织。
- `authority`：秩序制定者、官方权威或监管者。
- `resource_holder`：关键资源持有者。
- `quest_giver`：任务发布者或剧情推动组织。
- `conflict_driver`：冲突制造者或战争推动方。
- `background`：背景势力。

### FactionState.stage

建议值：

- `opening`：开篇阶段。
- `early_arc`：前期篇章。
- `mid_arc`：中期篇章。
- `late_arc`：后期篇章。
- `pre_conflict`：重大冲突前。
- `during_conflict`：重大冲突中。
- `post_conflict`：重大冲突后。
- `rise`：崛起期。
- `decline`：衰落期。
- `civil_strife`：内乱期。
- `war_time`：战争期。
- `aftermath`：余波期。
- `finale`：终章阶段。

### membershipType

建议值：

- `founder`：创立者。
- `leader`：最高领袖、掌门、族长、首领。
- `deputy`：副手、副领袖。
- `elder`：长老、元老、高层。
- `officer`：干部、军官、管理者。
- `core_member`：核心成员。
- `member`：普通成员。
- `disciple`：弟子、学徒。
- `associate`：外围成员、合作成员。
- `agent`：代理人、执行者。
- `spy`：间谍、卧底。
- `defector`：叛逃者。
- `traitor`：背叛者。
- `former_member`：前成员。
- `honorary_member`：名誉成员。
- `representative`：代表、使者、驻派人员。

### FactionRelation.relationType

建议值：

- `allied_with`：结盟。
- `enemy_of`：敌对。
- `rival_of`：竞争。
- `vassal_of`：附庸于。
- `overlord_of`：宗主、上级或控制方。
- `controls`：控制。
- `influences`：影响。
- `protects`：保护。
- `threatens`：威胁。
- `trades_with`：贸易往来。
- `cooperates_with`：合作。
- `neutral_to`：中立。
- `truce_with`：停战或暂时休战。
- `split_from`：从某势力分裂而来。
- `merged_into`：并入某势力。
- `infiltrates`：渗透。
- `investigates`：调查或监视。
- `formerly_allied_with`：曾经结盟。
- `formerly_enemy_of`：曾经敌对。

### FactionRule.relationType

建议值：

- `follows`：遵循该规则。
- `enforces`：执行或维护该规则。
- `created_by`：该规则由此势力制定或创建。
- `protected_by`：该规则保护此势力或其合法性。
- `restricted_by`：该势力受到该规则限制。
- `exempt_from`：该势力对该规则享有豁免。
- `violates`：该势力违反该规则。
- `exploits`：该势力利用该规则漏洞或机制。
- `opposes`：该势力反对该规则。
- `originates_from`：该规则源自该势力的传统、制度或行动。
- `required_for_membership`：该规则是成员资格或入门条件。

### enforcementLevel

建议值：

- `none`：不执行或仅作背景说明。
- `weak`：弱约束。
- `normal`：常规约束。
- `strong`：强约束。
- `absolute`：绝对约束。
- `variable`：随条件变化。

## 关系规则

- 势力层级用 `Faction.parentId` 表达。
- 角色与势力成员关系用 `FactionMembership` 表达。
- 势力与势力关系用 `FactionRelation` 表达。
- 势力规则用 `FactionRule` 连接 `WorldRule`。
- 地点与势力关系用 `LocationFaction` 表达，由 Location 模块拥有，但 Faction 侧可读取。
- `Faction` 与 `StoryItem`、`Species`、`WorldItem`、`Chapter` 的低频关系先用 `Relationship` 表达。
- 不在 `Faction` 上放 `headquartersLocationId`、`territoryLocationIds`、`memberIds`、`ruleIds`。

## FactionMembership 与 CharacterIdentity 的边界

`CharacterIdentity` 是叙事身份卡，用于描述角色在某段叙事中的身份呈现、称谓、伪装、阵营观感或读者 / 角色已知身份。它回答“这个角色以什么身份被叙事呈现”。

`FactionMembership` 是结构化成员关系，用于描述角色与势力之间可查询、可排序、可判断当前有效性的组织关系。它回答“这个角色是否属于某势力、担任什么职务、何时开始 / 结束、是否公开”。

边界示例：

- “林青云公开身份是青云宗外门弟子”可同时有一张 `CharacterIdentity` 和一条 `FactionMembership`。
- “林青云伪装成散修”主要是 `CharacterIdentity`，不代表他离开青云宗。
- “林青云被逐出青云宗”应更新或新增 `FactionMembership` 的 `isCurrent` / `endsAt` / `membershipType`，并可同步记录新的 `CharacterIdentity`。
- “林青云其实是魔教卧底”若需要结构化查询，应记录魔教的 `FactionMembership`，同时可用 `CharacterIdentity` 控制叙事揭示。

## Context Builder 读取原则

Context Builder 读取势力信息时，应优先选择：

- `canonStatus` 为 confirmed 的势力和关系。
- `deletedAt` 为空的未删除记录。
- `importance` 较高的势力。
- `visibility` 符合当前视角、读者揭示进度和生成目标的势力。
- `status` 与当前章节阶段相符的势力。
- 与当前章节、阶段或时间线匹配的 `FactionState`。
- 与当前角色、章节或冲突强相关的关键 `FactionMembership`。
- 与当前冲突、外交格局或阵营判断相关的 `FactionRelation`。
- Location 模块中与当前地点或势力相关、`isCurrent` 为真或时间范围匹配的 `LocationFaction`。
- 与势力相关、仍有效且重要的 `FactionRule`。

Context Builder 应避免把隐藏信息、废弃设定、已删除记录或未确认候选设定直接注入正文上下文，除非生成任务明确需要。

## 小说示例：青云宗

### Faction

- `name`：青云宗
- `aliases`：青云门、青云剑宗
- `factionType`：`sect`
- `narrativeRole`：`protagonist_side`
- `summary`：东玄洲正道三宗之一，以剑修传承和镇魔封印闻名。
- `description`：青云宗坐落于青云山脉，门下分为外门、内门、戒律堂、剑阁和丹房，长期镇守后山镇魔谷。
- `ideology`：斩妖除魔、守护凡境、以剑问心。
- `goal`：维持镇魔封印，培养新一代剑修，并查明魔气复苏的源头。
- `structure`：掌门统领全宗，长老会参与决策，下设戒律堂、剑阁、丹房、外门和内门。
- `resources`：青云灵脉、剑阁典籍、镇魔阵、丹房药田、三千弟子。
- `status`：`active`
- `visibility`：`public`
- `importance`：高
- `canonStatus`：confirmed

### FactionState

- `stage`：`post_conflict`
- `status`：`weakened`
- `powerLevel`：高层战力受损，但仍保持一流宗门实力。
- `influenceLevel`：在东玄洲影响力下降，附属小宗开始观望。
- `resourceState`：护山大阵耗损严重，丹药储备减少三成。
- `internalState`：戒律堂主张封山，剑阁主张主动追查魔气源头。
- `publicReputation`：外界认为青云宗镇魔不力，但仍承认其正道地位。
- `goal`：修复镇魔阵，并找出泄露封印位置的内鬼。
- `conflictSummary`：与黑莲教敌对加深，和玄霜阁暂时结盟。
- `eventSummary`：宗门大比后，镇魔谷封印破裂，数名弟子失踪。
- `stateNote`：读者暂不知道内鬼是外门执事。

### FactionMembership

- `factionId`：青云宗
- `characterId`：林青云
- `membershipType`：`disciple`
- `roleTitle`：外门弟子
- `rank`：外门三等
- `department`：外门
- `isCurrent`：true
- `isPublic`：true
- `startsAt`：第一章
- `notes`：因救下巡山弟子获得入门资格，尚未暴露剑骨天赋。
- `canonStatus`：confirmed

### FactionRelation

- `sourceFactionId`：青云宗
- `targetFactionId`：黑莲教
- `relationType`：`enemy_of`
- `direction`：`bidirectional`
- `strength`：strong
- `isCurrent`：true
- `startsAt`：百年前镇魔之战
- `description`：青云宗曾参与封印黑莲教教主残魂；黑莲教长期渗透青云宗以图破封。
- `canonStatus`：confirmed

### FactionRule

- `factionId`：青云宗
- `worldRuleId`：镇魔封印规则
- `relationType`：`enforces`
- `isPrimary`：true
- `enforcementLevel`：`strong`
- `notes`：掌门令和三位长老印记同时存在时才能开启镇魔谷阵门。
- `orderIndex`：1

### LocationFaction（由 Location 模块拥有，Faction 侧可读取）

- `locationId`：青云宗禁地
- `factionId`：青云宗
- `relationType`：`guards`
- `influenceLevel`：strong
- `isCurrent`：true
- `notes`：青云宗戒律堂负责日常封锁和巡查。

## 实现边界

本文档记录的是当前已确认的 Faction 设计，不代表 schema、API 或 UI 已实现。后续如需落地，应另行评审 schema、migration、后端 API、前端 UI、Context Builder 查询实现和数据迁移方案。
