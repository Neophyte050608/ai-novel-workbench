# WorldRules 模块

## 状态说明

本文记录当前已确认的 `WorldRule` 设计，用于指导后续 schema、API、UI、Context Builder 和 AI 生成接入。本设计只更新文档，不代表 schema、API 或 UI 已实现；本次也不生成 migration，不实现接口或界面。

## 模块定位

`WorldRule` 表示小说世界中的世界规则和写作约束。它描述创作过程、AI 生成和上下文构建需要遵守的规则、法则、禁令、限制、代价、例外和揭示条件。

`WorldRule` 是结构化写作约束，不是可执行规则引擎。系统可以读取它来排序、提示、筛选和注入上下文，但不根据它自动执行规则推理、状态结算或剧情裁决。

典型内容包括：

- 力量体系规则：魔法、修炼、科技、异能等系统的边界和代价。
- 世界法则：死亡、时间、空间、因果、神明、诅咒等设定约束。
- 禁令和限制：某地点、势力、物种、物品或行为的禁止条件。
- 社会运行规则：宗门戒律、法律、阶级制度、交易规则等会影响剧情的约束。
- 例外和揭示条件：规则何时不适用，何时能被角色、读者或正文明确知晓。

## 不负责什么

`WorldRule` 不负责实体档案。以下内容应由对应一等实体或模块承载：

- `Location`：地点、区域、建筑、秘境、星球、空间等档案。
- `Faction`：势力、组织、宗门、国家、公司、阵营等档案。
- `Species`：物种、种族、生物类型、血脉族群等档案。
- `StoryItem`：剧情道具、神器、装备、线索物、关键物品等档案。
- `Character`：角色、宠物、器灵、AI 生命等具备独立剧情状态的角色档案。
- `Chapter`：章节正文、章节摘要、章节状态和章节级写作产物。

`WorldRule` 也不负责完整体系介绍。修炼体系、科技体系、文化制度等背景说明可归入 `WorldItem(system/social_system/culture)`；其中需要被创作过程严格遵守的约束，再拆为 `WorldRule`。

## 字段清单

| 字段 | 说明 |
|---|---|
| `id` | 规则 ID，唯一标识一条 `WorldRule`。 |
| `projectId` | 所属小说项目 ID。 |
| `title` | 规则标题，用简短名称标识规则，例如“死者不可无代价复生”。 |
| `summary` | 规则摘要，用于列表展示、Context Builder 压缩和 AI 快速识别。 |
| `content` | 规则正文，描述完整约束、背景解释、适用方式和叙事注意事项。 |
| `ruleType` | 规则领域或作用对象类型，说明规则主要约束什么领域或对象。 |
| `category` | 规则逻辑形态，说明规则本身属于法则、禁令、限制、代价、例外等哪类逻辑。 |
| `priority` | 排序和提示优先级，仅用于 Context Builder 和 AI prompt 的选择、排序、强调；不表示系统自动执行规则推理。 |
| `status` | 规则生命周期或生效状态，用于区分启用、停用、被废止、待确认等状态。 |
| `condition` | 适用条件或触发条件，例如在何种地点、时间、身份、行为或剧情阶段下适用。 |
| `effect` | 规则效果，即满足条件时世界观上应呈现的结果或限制。 |
| `cost` | 遵守、触发、绕过或违反规则需要付出的代价。 |
| `exception` | 例外说明，记录哪些情况、对象或条件可部分或完全不受规则约束。 |
| `violationConsequence` | 违反后果，说明突破软规则或违背禁令时应产生的叙事、世界观、角色或剧情后果。 |
| `isHardRule` | 是否硬规则。硬规则必须遵守；软规则可被突破，但需要解释原因并体现后果。 |
| `isRevealed` | 是否已在正文或角色认知中揭示。未揭示规则可作为作者和 AI 的内部约束，但不能在正文中直接剧透。 |
| `visibility` | 叙事可见性，描述规则对作者、读者、角色或公开世界的可见范围。 |
| `importance` | 重要度，用于检索、上下文注入和排序；与 `priority` 一起影响提示位置。 |
| `canonStatus` | 正史状态，例如草稿、已确认、归档；Context Builder 默认读取已确认设定。 |
| `sourceType` | 来源类型，例如用户创建、AI 生成、导入、章节总结、规划产物等。 |
| `sourceId` | 来源记录 ID，用于追踪该规则来自哪个任务、章节、导入记录或规划项。 |
| `createdAt` | 创建时间。 |
| `updatedAt` | 更新时间。 |
| `deletedAt` | 软删除时间；有值表示该规则不应被默认读取。 |

## 建议值

### `ruleType` 建议值

`ruleType` 表示规则的领域或作用对象类型。建议值包括：

- `world_law`：世界基础法则，例如死亡、时间、空间、因果、神明干预。
- `power_system`：力量体系规则，例如修炼、魔法、异能、科技能力。
- `location_rule`：地点相关规则，例如禁地、结界、地形、空间限制。
- `faction_rule`：势力相关规则，例如宗门戒律、组织规章、国家法律。
- `species_rule`：物种或血脉相关规则，例如天赋、弱点、繁衍、变身限制。
- `story_item_rule`：道具相关规则，例如神器使用条件、诅咒物代价、钥匙限制。
- `character_rule`：角色相关规则，例如誓约、契约、身份限制、能力封印。
- `social_rule`：社会、经济、文化、制度相关规则。
- `narrative_rule`：叙事层面的写作约束，例如伏笔揭示顺序、信息禁区。
- `custom`：无法归入上述类型的自定义规则。

### `category` 建议值

`category` 表示规则的逻辑形态。建议值包括：

- `law`：稳定法则，描述世界如何运作。
- `restriction`：限制，描述能力、行为或状态的边界。
- `prohibition`：禁令，描述明确禁止的行为。
- `cost`：代价，描述获得效果或突破限制必须付出的代价。
- `exception`：例外，描述规则不适用或可被绕过的条件。
- `condition`：条件，描述某效果成立前必须满足的前提。
- `consequence`：后果，描述违反或触发规则后的结果。
- `reveal_condition`：揭示条件，描述规则何时能被正文、读者或角色知晓。
- `custom`：无法归入上述形态的自定义逻辑。

### `status` 建议值

`status` 表示规则当前是否可用或是否仍然有效。建议值包括：

- `active`：当前生效，Context Builder 可默认考虑。
- `inactive`：当前不生效，但保留记录。
- `deprecated`：已废止，不应继续用于新内容。
- `pending`：待确认，不应默认注入正式上下文。
- `changed`：规则已在剧情中发生变化，需要结合时间线或章节关系读取。

### `visibility` 建议值

`visibility` 表示叙事可见范围。建议值包括：

- `public`：世界内公开，普通角色通常可知。
- `limited`：仅部分角色、势力、地区或群体可知。
- `hidden`：读者或主要角色暂未知，但作者和系统可作为内部约束使用。
- `secret`：高敏感秘密，只有作者或极少数剧情对象知晓；注入 prompt 时应避免剧透正文。

## `ruleType` 与 `category` 的区别

`ruleType` 是领域或作用对象类型，回答“这条规则主要约束什么”。例如同样是禁令，可能约束地点、势力、物种或道具。

`category` 是规则逻辑形态，回答“这条规则以什么逻辑发挥作用”。例如同一地点规则可以是禁令、代价、例外或揭示条件。

示例：

- “青云宗禁地禁止御剑”可以是 `ruleType=location_rule`，`category=prohibition`。
- “复活死者必须献祭同等生命”可以是 `ruleType=world_law`，`category=cost`。

## `priority` 的边界

`priority` 仅用于 Context Builder 和 AI prompt 的排序、筛选、提示强度和展示顺序。高优先级规则更容易被选入上下文，并可在 prompt 中被更靠前或更强地提醒。

`priority` 不表示系统会自动执行规则推理，不表示规则会自动阻止写作、不自动结算代价、不自动判断例外，也不自动修改角色、地点、章节或道具状态。

## `isHardRule`、`isRevealed`、`visibility` 的区别

- `isHardRule` 表示约束强度。`true` 表示硬规则，AI 和作者生成内容时必须遵守；`false` 表示软规则，可以被剧情突破，但必须解释突破原因并体现 `violationConsequence`。
- `isRevealed` 表示揭示状态。`true` 表示该规则已经可在正文或角色认知中明确出现；`false` 表示规则尚未揭示，只能作为内部约束使用，不能直接写成剧透性正文。
- `visibility` 表示可见范围。它描述规则对哪些叙事对象可见，例如公开、部分可知、隐藏或秘密。

三者可以组合使用。例如：一条规则可以是硬规则、尚未揭示、且 `visibility=secret`。此时 AI 必须遵守它，但正文不能直接说明秘密规则本身。

## 关联边界

`WorldRule` 不使用 `scopeType` / `scopeId`。规则适用对象不通过单一 scope 字段表达。

规则与地点、势力、物种、道具、角色、章节等对象的适用关系，应通过专门关联或通用关系层表达，例如：

- `LocationRule`：地点与规则的适用关系。
- `FactionRule`：势力与规则的适用关系。
- `SpeciesRule`：物种与规则的适用关系。
- 后续 `StoryItemRule`：道具与规则的适用关系。
- `Relationship`：跨实体、多对多、有方向、有来源追踪的关系，例如约束、例外、依赖、冲突、压制、绕过。

这样可避免把复杂、多对象、多阶段的适用关系压缩进 `WorldRule.scopeType/scopeId`，也便于后续扩展时间线、章节范围和关系来源。

## 不加入规则引擎字段

`WorldRule` 不加入以下规则引擎字段：

- `expression`
- `ruleEngineJson`
- `triggerScript`
- `resolver`

这些字段会把 `WorldRule` 推向可执行规则引擎，增加安全、调试、迁移和一致性成本。当前定位只保留结构化写作约束，让 Context Builder 和 AI 读取后用于提示和创作约束。

## Context Builder 读取原则

Context Builder 读取 `WorldRule` 时应优先考虑以下原则：

1. 默认读取 `canonStatus=confirmed` 的规则；草稿、归档或待确认规则需用户或流程明确选择。
2. 忽略已软删除规则，即 `deletedAt` 有值的规则。
3. 根据 `status` 判断规则是否当前生效；`active` 优先，`inactive`、`deprecated`、`pending` 不应默认注入正式上下文。
4. 根据 `importance` 和 `priority` 排序；重要且高优先级规则更靠前。
5. 优先注入 `isHardRule=true` 的规则，避免生成内容破坏世界基础约束。
6. 根据 `visibility` 控制提示方式；隐藏或秘密规则可作为内部约束，但不能直接泄露给正文。
7. 根据 `isRevealed` 控制正文可说出的信息；未揭示规则只能用于约束生成，不能直接剧透。
8. 根据当前角色、地点、势力、物种、道具、章节的相关性筛选规则。
9. 通过 `LocationRule`、`FactionRule`、`SpeciesRule`、后续 `StoryItemRule` 或 `Relationship` 判断规则与当前上下文的关联。

## AI 使用原则

AI 生成正文、设定、章节摘要或规划内容时，应按以下原则使用 `WorldRule`：

1. 硬规则必须遵守，不能为了戏剧性直接违反。
2. 软规则可以被突破，但必须体现合理原因、代价或 `violationConsequence`。
3. `isRevealed=false` 的规则可作为内部约束，但不能在正文中直接剧透规则真相。
4. `visibility=hidden/secret` 的规则应谨慎使用，只能影响生成方向，不应直接暴露给读者或不知情角色。
5. 当规则存在例外时，AI 必须同时检查 `condition`、`exception` 和相关实体关系，避免误用例外。
6. 当规则与当前角色、地点、势力、物种、道具或章节强相关时，应优先纳入生成约束。

## 示例

### 示例一：死者不可无代价复生

| 字段 | 示例值 |
|---|---|
| `title` | 死者不可无代价复生 |
| `summary` | 死者可以被复生，但必须支付等价生命、记忆或灵魂代价。 |
| `ruleType` | `world_law` |
| `category` | `cost` |
| `priority` | `high` |
| `status` | `active` |
| `condition` | 当角色试图复活已死亡对象时适用。 |
| `effect` | 复生不能无条件成功，必须引入代价或不完全复生结果。 |
| `cost` | 献祭同等生命、永久失去关键记忆，或灵魂残缺。 |
| `exception` | 神明级存在可转移代价，但不能取消代价。 |
| `violationConsequence` | 若剧情表面出现无代价复生，后续必须揭示隐藏代价或伪复生真相。 |
| `isHardRule` | `true` |
| `isRevealed` | `false` |
| `visibility` | `secret` |
| `importance` | `high` |
| `canonStatus` | `confirmed` |

使用说明：AI 必须遵守复生代价，但在规则尚未揭示前，正文不能直接解释“复生必须付出灵魂代价”。可以通过异常症状、角色失忆或旁观者疑惑埋伏笔。

### 示例二：青云宗禁地禁止御剑

| 字段 | 示例值 |
|---|---|
| `title` | 青云宗禁地禁止御剑 |
| `summary` | 青云宗禁地内禁止御剑飞行，违者会触发护山禁制。 |
| `ruleType` | `location_rule` |
| `category` | `prohibition` |
| `priority` | `medium` |
| `status` | `active` |
| `condition` | 角色进入青云宗禁地范围后适用。 |
| `effect` | 御剑术无法稳定施展，强行御剑会暴露位置。 |
| `cost` | 灵力反噬，短时间内无法继续施展身法。 |
| `exception` | 掌门令牌可临时解除禁制，但会留下阵法记录。 |
| `violationConsequence` | 触发警报、引来执法长老，并可能暴露潜入剧情。 |
| `isHardRule` | `true` |
| `isRevealed` | `true` |
| `visibility` | `limited` |
| `importance` | `medium` |
| `canonStatus` | `confirmed` |

使用说明：当章节发生在青云宗禁地，且角色尝试移动、潜入或逃离时，Context Builder 应优先注入该规则。AI 不能直接写角色在禁地内无后果御剑逃脱，除非同时使用掌门令牌等例外并体现阵法记录。

## 开发规则

1. 本设计不代表 schema、API 或 UI 已实现。
2. 本设计不要求本次生成 migration。
3. 实现 schema 前，应先确认字段枚举、索引、关联表和历史数据迁移策略。
4. 实现 API/UI 前，应先确认筛选、排序、关联编辑、揭示状态和可见性展示方案。
5. Context Builder 接入时，只把 `WorldRule` 当作结构化写作约束读取，不把它当作自动执行的规则引擎。
