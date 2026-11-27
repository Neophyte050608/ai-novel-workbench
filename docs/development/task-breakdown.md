# 开发任务拆分

本项目按模块推进。每个模块必须有：职责边界、开发规则、任务列表、验收标准。

优先级标记：

- P0：地基和阻塞项，必须先做。
- P1：MVP 必须做。
- P2：第二阶段增强。
- P3：后置能力。

## 总体开发顺序

```txt
P0 运行环境与规范
  -> P0 Project / 书架 / 类型标签
  -> P1 手动创建小说
  -> P1 工作台骨架
  -> P1 小说信息
  -> P1 人物
  -> P1 世界观
  -> P1 大纲规划
  -> P1 章节正文与版本
  -> P1 章节写作工作台
  -> P1 AI Draft / Proposal
  -> P1 Context Builder
  -> P1 Prompt 管理
  -> P1 LLM Provider 模型接入层
  -> P1 生成任务与 SSE
  -> P2 小说记忆
  -> P2 AI 创建小说
  -> P2 伏笔 / 道具 / 地点 / 势力
  -> P3 工作流编辑器 / 导出 / 图谱
```

---

# P0：运行环境与项目规范

## 职责

保证项目能稳定启动、迁移、检查和预览。

## 开发规则

1. 修改启动方式必须同步更新 `scripts/dev.sh` 和 `docs/development/local-start.md`。
2. 任何新依赖必须通过 `pnpm install --no-frozen-lockfile` 更新 lockfile。
3. 所有提交前必须跑：
   - `pnpm typecheck`
   - `pnpm build`
4. 数据库结构变更必须走 Prisma Migrate。
5. 新增复杂交互前必须先更新交互文档或画交互图。
6. 新增或修改实体 API 前，必须遵守 `docs/development/entity-api-principles.md`：基础 CRUD 需要同时服务前端手动编辑、AI 草稿生成/补全、Context Builder 读取、批量编排和 AI 可重试错误处理。

## 任务

| 编号 | 任务 | 状态 | 验收标准 |
|---|---|---|---|
| P0-1 | 一键启动脚本 | 已做 | `pnpm start:dev` 可启动依赖与前后端 |
| P0-2 | Docker 端口固定 | 已做 | Postgres 55432，Redis 6380 |
| P0-3 | Prisma migration 流程 | 已做 | migration 可执行，文档有说明 |
| P0-4 | Semi MCP 配置 | 已做 | `.mcp.json` 和 `.cursor/mcp.json` 存在 |
| P0-5 | 交互原则沉淀 | 已做 | `interaction-principles.md` 存在 |
| P0-6 | doctor 脚本增强 | 已做 | 能检查 web/api/db/redis/schema 状态 |

---

# P0：Project / 书架 / 类型标签

## 职责

管理小说项目的创建、展示、删除，以及有限类型和标签。

## 开发规则

1. Project 是小说顶层资源，所有下级资源必须带 `projectId`。
2. 书架层只能展示小说列表、新建入口、删除/进入工作台。
3. 类型和标签必须来自 `Genre` / `Tag` 表。
4. 不允许重新在 Project 上增加自由文本 genre 字段。
5. 删除小说优先软删除。
6. 新建小说不能使用 Modal 弹窗。

## 任务

| 编号 | 任务 | 状态 | 验收标准 |
|---|---|---|---|
| PROJ-1 | Project schema 基础字段 | 已做 | Project 字段覆盖小说基础档案 |
| PROJ-2 | Genre / Tag 表 | 已做 | 类型和标签可 seed |
| PROJ-3 | Project CRUD API | 已做 | GET/POST/PATCH/DELETE 稳定返回，不乱 500 |
| PROJ-4 | 书架页左列表右详情 | 已做 | 能创建、选择、删除小说 |
| PROJ-5 | 手动创建小说 | 已做 | 可选择类型/标签并写入关联表 |
| PROJ-6 | API 错误格式统一 | 已做 | 400/404/500 返回结构统一 |
| PROJ-7 | PATCH 编辑小说基础属性 | 待做 | 可编辑标题、简介、风格等 |

---

# P1：工作台骨架

## 职责

进入某部小说后，展示项目内资源导航和模块容器。

## 开发规则

1. 人物、世界观、章节、伏笔等只能在工作台层出现。
2. 工作台导航可以先做骨架，但不能显示可执行的假功能。
3. 工作台顶部必须显示当前小说名和返回书架入口。
4. 工作台模块切换先做本地状态，后续再接路由。

## 任务

| 编号 | 任务 | 状态 | 验收标准 |
|---|---|---|---|
| WS-1 | 工作台页面骨架 | 已做 | 点击小说进入工作台 |
| WS-2 | 项目内导航 | 已做 | 显示小说信息、人物、世界观等模块 |
| WS-3 | 返回书架 | 已做 | 可回到书架列表 |
| WS-4 | 模块容器规范 | 待做 | 每个模块有统一 header/action/layout |
| WS-5 | 路由化 | 后置 | `/projects/:projectId/workspace` 可直达 |

---

# P1：小说信息模块

## 职责

维护一部小说的完整基础档案。

## 开发规则

1. 小说信息是工作台内模块，不是书架外部入口。
2. 字段按分组展示：基础信息、创意设定、小说内容、风格设定。
3. 字段级 AI 改写在模型接入前不展示为可执行按钮。
4. 类型/标签使用 Select，不允许自由输入长期值。

## 字段分组

### 01 基础信息

- 封面
- 标题
- 副标题
- 类型
- 标签
- 预计章节数
- 每章字数
- 目标篇幅

### 02 创意设定

- 一句话卖点 `logline`
- 核心设定 `premise`
- 核心创意 `coreIdea`
- 主线剧情 `mainPlot`
- 情绪基调 `tone`

### 03 小说内容

- 引言 `intro`
- 简介 `summary`
- 核心种子 `storySeed`
- 世界观摘要 `worldview`
- 时代背景 `eraBackground`
- 主角简述 `protagonist`

### 04 风格设定

- 写作风格 `writingStyle`
- 叙事视角 `pov`

## 任务

| 编号 | 任务 | 状态 | 验收标准 |
|---|---|---|---|
| INFO-1 | 信息页分组布局 | 已做 | 工作台内小说信息按基础信息、创意设定、风格与篇幅分组展示 |
| INFO-2 | 字段编辑 | 已做 | 工作台内小说信息可编辑并通过 Project PATCH 保存 |
| INFO-3 | 类型/标签编辑 | 部分已做 | 新建小说使用 Genre/Tag 有限表平铺多选；工作台内类型/标签编辑后续补齐 |
| INFO-4 | 字段级展示组件 | 部分已做 | 当前实体查看态已有统一分组/字段展示，后续可抽独立 FieldBlock 组件 |
| INFO-5 | AI 改写占位规则 | 已遵守 | 模型未接入时不显示可执行 AI 改写按钮 |

---

# P1：人物模块

## 职责

管理当前小说的人物档案和人物状态。

## 开发规则

1. 人物必须归属于 Project。
2. `Character` 描述角色是谁，`CharacterState` 描述某阶段状态。
3. 不允许只用一个 currentState JSON 代替状态历史。
4. 角色关系后续进入 Relationship，不塞自由文本。

## 任务

| 编号 | 任务 | 状态 | 验收标准 |
|---|---|---|---|
| CHAR-1 | 人物列表 | 已做 | 工作台人物模块可查看当前项目人物，后端按 projectId 查询 |
| CHAR-2 | 新建人物 | 已做 | 人物创建写入 projectId，默认 draft，支持 sourceType/sourceId |
| CHAR-3 | 人物详情 | 已做 | 展示基础档案并支持查看/编辑态切换 |
| CHAR-4 | 人物状态记录 | API 已做 | CharacterState API 已完成；前端完整状态编辑 UI 后续细化 |
| CHAR-5 | 人物身份记录 | API 已做 | CharacterIdentity API 已完成；前端完整身份编辑 UI 后续细化 |
| CHAR-6 | 关系管理 | P2 | 使用 Relationship 关联人物，不塞自由 JSON |

---

# P1：世界观模块

## 职责

管理小说项目中的世界观资料，并按长期领域边界拆分为 `Location` / `Faction` / `Species` / `StoryItem` / `WorldRule` / `WorldItem`。

`WorldItem` 不再作为所有世界观实体的大一统容器，后续收窄为通用世界设定，例如体系、历史、文化、概念、社会制度和其他非一等实体设定。

## 开发规则

1. 世界观实体必须归属于 Project。
2. `Location`、`Faction`、`Species`、`StoryItem`、`WorldRule` 是后续一等实体方向。
3. 地点、势力、物种、剧情道具、世界规则不应长期塞进 `WorldItem`。
4. `WorldItem` 只承载通用世界设定，不继续扩大 location/organization/species/item/rule 混用。
5. 各世界观实体应遵循统一字段原则：`projectId`、`name/title`、`aliases`、`summary`、`description/content`、`status`、`visibility`、`importance`、`canonStatus`、`sourceType/sourceId`、`createdAt/updatedAt/deletedAt`。
6. 跨实体连接统一通过 `Relationship` 表达，避免在实体上堆单一外键。
7. Context Builder 默认只读取 confirmed 条目，除非用户明确选择草稿。
8. schema/API/UI 实现前必须先补对应模块文档和任务拆分。

## 任务

| 编号 | 任务 | 状态 | 验收标准 |
|---|---|---|---|
| WORLD-DOC-1 | 世界观实体拆分文档 | 已做 | `world-items.md` 明确 WorldItem 收窄与一等实体方向 |
| WORLD-RULE-1 | WorldRule 模块设计 | 已做 | 明确规则职责边界、字段方向、非规则引擎边界 |
| WORLD-RULE-2 | WorldRule schema/migration | 已做 | WorldRule 已进入 Prisma schema 并完成 migration 文档 |
| WORLD-RULE-3 | WorldRule 基础 API | 已做 | 支持列表、新建、详情、编辑、软删除、confirm/archive |
| WORLD-RULE-4 | WorldRule 基础 UI 接入 | 已做 | 工作台世界规则模块接入真实 API，支持基础查看/编辑 |
| WORLD-LOC-1 | Location 模块设计 | 已做 | 明确 Location/LocationState/LocationRule/LocationFaction 职责边界 |
| WORLD-LOC-2 | Location schema/migration | 已做 | Location 相关模型已进入 Prisma schema 并完成 migration 文档 |
| WORLD-LOC-3 | Location 基础 API | 已做 | 支持 Location、State、Rule、Faction 关联基础 API 和 profile |
| WORLD-LOC-4 | Location 基础 UI 接入 | 已做 | 工作台地点模块接入真实 API，支持基础查看/编辑 |
| WORLD-FAC-1 | Faction 模块设计 | 已做 | 明确 Faction/State/Membership/Relation/Rule 职责边界 |
| WORLD-FAC-2 | Faction schema/migration | 已做 | Faction 相关模型已进入 Prisma schema 并完成 migration 文档 |
| WORLD-FAC-3 | Faction 基础 API | 已做 | 支持 Faction、State、Membership、Relation、Rule 基础 API 和 profile |
| WORLD-FAC-4 | Faction 基础 UI 接入 | 已做 | 工作台势力模块接入真实 API，支持基础查看/编辑 |
| WORLD-SPEC-1 | Species 模块设计 | 已做 | 明确 Species/Trait/Ability/Rule 职责边界，未拆 SpeciesLocation |
| WORLD-SPEC-2 | Species schema/migration | 已做 | Species 相关模型已进入 Prisma schema 并完成 migration 文档 |
| WORLD-SPEC-3 | Species 基础 API | 已做 | 支持 Species、Trait、Ability、Rule 基础 API 和 profile |
| WORLD-SPEC-4 | Species 基础 UI 接入 | 已做 | 工作台物种模块接入真实 API，支持基础查看/编辑 |
| WORLD-ITEM-1 | 能力与道具模块设计 | 已做 | 明确 StoryItem/Ability 职责边界、共享字段、规则/关系策略 |
| WORLD-ITEM-2 | 能力与道具 schema/migration | 待做 | StoryItem/Ability 作为一等实体进入 Prisma schema |
| WORLD-ITEM-3 | 能力与道具基础 API | 待做 | 支持 StoryItem/Ability 基础 CRUD、confirm/archive、profile |
| WORLD-ITEM-4 | 能力与道具基础 UI | 待做 | 工作台内新增能力与道具模块，支持道具/技能人工维护 |
| WORLD-GEN-1 | WorldItem 通用设定收窄 | 已做 | WorldItem 已明确收窄为体系/历史/文化/概念/社会制度等通用设定；保留旧 enum 值且不自动迁移历史数据 |
| WORLD-GEN-2 | WorldItem 通用设定 API/UI | 已做 | 可查看/新建/编辑通用世界设定，新建类型限制为 system/history/culture/concept/social_system/custom，避免混入一等实体 |
| WORLD-SUB-1 | 子资源完整 UI | 待做 | 细化地点规则/地点势力、势力成员/关系/规则、物种特征/能力/规则的新增编辑 UI |
| WORLD-REL-1 | Relationship 连接策略落地 | 已做 | 可连接角色、地点、势力、物种、道具、规则和通用设定 |

## 当前实体地基收尾任务

| 编号 | 任务 | 状态 | 验收标准 |
|---|---|---|---|
| ENTITY-REL-1 | Relationship 设计收口 | 已做 | `docs/modules/relationships.md` 明确跨实体关系的 source/target 类型、relationType 建议值、方向、证据、生命周期和 Context Builder 读取方式 |
| ENTITY-REL-2 | Relationship 基础 API | 已做 | 支持按项目、按实体查询关系，创建/编辑/删除关系，校验 source/target 同 project，并实现 confirm/archive 与弱重复检测 |
| ENTITY-REL-3 | Relationship 基础 UI | 已做 | 各实体详情关系区可新增/删除关系，并在关系另一侧可见；编辑关系可后续细化 |
| ENTITY-SUB-1 | 子资源 UI 设计收口 | 待做 | 明确人物状态/身份、地点规则/势力、势力成员/关系/规则、物种特征/能力/规则、道具状态/规则、能力规则的统一交互模式 |
| ENTITY-SUB-2 | 高频子资源 UI | 待做 | 优先实现人物状态/身份、地点规则/势力、势力成员、物种能力、道具状态的新增/编辑/删除 |
| ENTITY-WORLD-1 | WorldItem 收窄方案 | 已做 | 已明确保留/废弃类型、历史兼容策略、不迁移旧数据、通用设定类型范围 |
| ENTITY-WORLD-2 | WorldItem 通用设定 API/UI | 已做 | 支持体系/历史/文化/概念/社会制度等通用设定的基础人工维护，并限制新建类型白名单 |
| ENTITY-QA-1 | 已有实体 API 冒烟测试 | 已做 | 已运行 Character/Location/Faction/Species/WorldRule/StoryItem/Ability 现有 service specs；覆盖 list/create/update/delete/profile 等基础链路 |
| ENTITY-QA-2 | 前端工作台人工录入冒烟 | 基础已做 | 已完成静态/构建验证：新建小说可进入工作台，工作台包含小说信息、人物、地点、势力、物种、世界规则、能力与道具；未声明人工全量验收 |
| ENTITY-DOC-1 | 实体实现状态文档同步 | 已做 | task-breakdown 已同步实体实现状态，未实现 Relationship/子资源 UI/WorldItem 通用设定等仍标待做 |
| ENTITY-COMMIT-1 | 阶段提交 | 已做 | 通过 entity service specs、typecheck、build 后提交并推送到远程仓库 |

---

# P1：大纲规划模块

## 职责

管理分卷 / 故事单元和轻量章节计划。P1 中 `Volume` 即 StoryUnit，不新增 `VolumePlan` 或平行故事单元表。

## 开发规则

1. `Volume` 和 `ChapterPlan` 不得混进 Chapter 正文。
2. `ChapterPlan` 只保留轻量计划字段：标题、目标、大纲、POV、约束、排序、状态、正史状态和来源追溯。
3. 生成章节前应优先读取已确认 ChapterPlan；但 P1 不实现 Context Builder。
4. MVP 先做 Volume + ChapterPlan，不做 Arc、Timeline、VolumePlan、AI 生成或复杂拖拽树。
5. PATCH 必须使用 allow-list，不允许写入 `projectId`、`chapterId`、`canonStatus`、`deletedAt` 等受控字段。
6. Service 层必须校验 project 边界、volumeId 同 project、chapterId 同 project、volume/chapter 一致性和软删除过滤。

## 任务

| 编号 | 任务 | 状态 | 验收标准 |
|---|---|---|---|
| PLAN-DOC-1 | Planning P1 文档收口 | 已做 | `docs/modules/planning.md` 明确 Volume=StoryUnit、ChapterPlan 轻量计划、P1/P2/P3 边界 |
| PLAN-SCHEMA-1 | ChapterPlan P1 字段与索引 | 已做 | ChapterPlan 增加 volumeId/status/canonStatus/sourceType/sourceId，Volume 增加 chapterPlans，未新增 VolumePlan |
| PLAN-MIGRATION-1 | Prisma migration 与说明 | 已做 | 生成 `add_planning_p1_fields` migration，并新增 `docs/database/migrations/0010-add-planning-p1-fields.md` |
| PLAN-API-1 | Volume 基础 API | 已做 | 支持 list/create/detail/patch/delete/reorder，按 project 和软删除边界过滤 |
| PLAN-API-2 | ChapterPlan 基础 API | 已做 | 支持 list/create/detail/patch/delete/confirm/archive/restore，PATCH 使用 allow-list |
| PLAN-API-3 | 从计划创建章节 | 已做 | `POST /projects/:projectId/chapter-plans/:planId/create-chapter` 创建 Chapter 并回填 ChapterPlan.chapterId |
| PLAN-UI-1 | 工作台规划模块 | 已做 | 工作台新增“规划”模块，左侧分卷/故事单元、中间章节计划、右侧计划详情/编辑 |
| PLAN-UI-2 | 人工维护闭环 | 已做 | 可创建/编辑/删除分卷；可创建/编辑/删除/确认/归档/恢复计划；可从计划创建正式章节 |
| PLAN-QA-1 | 自检与越界审查 | 已做 | 已跑 prisma format/validate/db:generate、api typecheck、web typecheck/build；确认未做 AI、Timeline、VolumePlan、Context Builder、PromptRender/GenerationTask 扩展 |

---

# P1：章节正文与版本

## 职责

管理章节元信息、读者最终看到的一章完整正文、版本历史和当前版本指针。Chapter 是发布/阅读单位，Scene 是内部创作颗粒度。

## 开发规则

1. Chapter 是章节元信息和发布单位，不得直接覆盖 Chapter 正文。
2. 完整章节正文必须保存为 ChapterVersion。
3. 手动编辑正文必须创建新 ChapterVersion，可选择同时激活为当前版本。
4. 激活版本只更新 `Chapter.currentVersionId`，必须校验版本属于同 project / chapter。
5. SceneVersion 可按 Scene 顺序装配为 ChapterVersion；P1 不新增 `ChapterVersionSceneVersion` join 表。
6. 从场景装配时，任一 Scene 缺少当前版本或当前版本软删除，都必须清晰报错。
7. ChapterSummary 是章节级摘要，P1 支持人工维护和从已确认 SceneSummary 汇总；不写入长期 MemoryRecord。
8. 从场景摘要汇总时，任一 Scene 缺少 confirmed SceneSummary 都必须清晰报错，不使用 draft fallback。
9. P1 不考虑多人协作，不做 AI 生成、PromptRender、ContextBuilder、MemoryRecord、发布平台或富文本编辑器。

## 任务

| 编号 | 任务 | 状态 | 验收标准 |
|---|---|---|---|
| CHAP-1 | 章节列表 | 已做 | 工作台按项目展示章节，保留新增/编辑/删除章节元信息能力 |
| CHAP-2 | 章节正文编辑 | 已做 | 章节详情提供正文 textarea，可编辑读者最终看到的完整章节正文；不使用富文本 |
| CHAP-3 | 版本保存 | 已做 | 保存正文创建 ChapterVersion，不直接覆盖 Chapter；支持版本说明 |
| CHAP-4 | 激活版本 | 已做 | 可将 ChapterVersion 设置为当前版本，后端校验同 project / chapter |
| CHAP-5 | 从场景装配 | 已做 | 可按 Scene.orderIndex 拼接各 Scene.currentVersionId 对应 SceneVersion.content，生成 ChapterVersion；支持包含场景标题和装配后激活 |
| CHAP-6 | 章节 profile | 已做 | 提供当前版本、版本列表、字数、场景数量、摘要列表、latestSummary/currentSummary 和装配可用性给前端详情区 |
| CHAP-7 | 章节摘要 | 已做 | 支持 ChapterSummary 列表、新增、编辑、软删除、确认、归档、恢复；profile 返回 latestSummary/currentSummary；不写 MemoryRecord |
| CHAP-8 | 从场景摘要汇总 | 已做 | 按 Scene.orderIndex 读取每个未删除 Scene 的 confirmed SceneSummary，组合 summary/keyEvents/characterChanges/newFacts 创建 draft ChapterSummary；缺失 confirmed 时清晰报错；不调用 AI |

---

# P1：章节写作工作台 / Chapter Writing Workspace

## 职责

把章节、场景、场景正文、场景摘要、场景交接、章节正文装配和章节摘要收敛到同一个章节上下文里，成为作者日常写一章的主入口。

`ChapterWorkspace` 负责“我今天怎么把这一章写完”。独立 `SceneWorkspace` 保留为“场景库”，负责跨章节检索、批量维护和结构健康检查。

## 开发规则

1. P1 优先 UI / 流程收敛，尽量不改 schema。
2. 日常写作必须能在章节页内完成，不要求用户跳到独立场景页。
3. 场景计划、正文、摘要、交接仍使用 Scene 模块 API，不复制业务规则。
4. 章节正文仍写入 ChapterVersion，不直接覆盖 Chapter。
5. 装配硬阻塞和软提醒必须分开：缺当前场景正文阻止装配；缺摘要/交接只提醒。
6. SceneSummary / SceneHandoff 必须能确认、归档、恢复，否则后续 Context Builder 无可靠输入。
7. P1 不显示 AI 自动生成按钮，不做 PromptRender、ContextBuilder、模型接入、富文本、多人协作或发布平台。
8. 独立 SceneWorkspace 文案应调整为“场景库 / 全局场景管理”，不再暗示它是写一章的必经入口。

## 任务

| 编号 | 任务 | 状态 | 验收标准 |
|---|---|---|---|
| CWW-DOC-1 | 章节写作工作台设计文档 | 已做 | `docs/modules/chapter-writing-workspace.md` 存在，明确定位、布局、写作流、阻塞清单、AI 后续链路和 P1/P2/P3 |
| CWW-TASK-1 | 任务拆分 | 已做 | `task-breakdown.md` 包含章节写作工作台职责、边界、任务与验收 |
| CWW-UI-1 | ChapterWorkspace 定位与导航文案 | 已做 | 页面命名/副标题体现“章节写作”，空状态不再提示去场景工作台；SceneWorkspace 改为“场景库”定位 |
| CWW-UI-2 | 写作流 Tab | 已做 | 章节详情默认进入“写作流”，展示本章场景列表和当前场景详情 |
| CWW-UI-3 | 场景详情内嵌 | 已做 | 不离开章节页即可新增/编辑场景基础信息、ScenePlan、SceneVersion、SceneSummary、SceneHandoff |
| CWW-UI-4 | SceneSummary / SceneHandoff 确认能力 | 已做 | 在章节工作台内可 confirm/archive/restore/delete 场景摘要和交接；未 confirmed 明确提示不会作为可靠上下文 |
| CWW-UI-5 | 装配阻塞清单 | 已做 | 展示本章硬阻塞和软提醒；点击可定位到对应场景与处理 Tab |
| CWW-UI-6 | 下一步建议 | 已做 | 根据章节/场景状态推荐“添加场景/写正文/确认摘要/补交接/装配正文/汇总摘要”等下一步 |
| CWW-UI-7 | 章节正文与摘要入口收敛 | 已做 | 章节正文、版本记录、章节摘要仍可用，并能从写作流顺畅进入装配/汇总 |
| CWW-QA-1 | 章节写作闭环验收 | 已做 | 用户在第 N 章内无需切换到独立 Scene 模块，即可完成建场景、写场景、激活正文、确认摘要/交接、装配 ChapterVersion、汇总 ChapterSummary |

## P2 后置任务

| 编号 | 任务 | 状态 | 验收标准 |
|---|---|---|---|
| CWW-P2-1 | Scene-aware Context Builder | 后置 | 生成单场正文时可读取当前 ScenePlan、前序 SceneSummary/Handoff 和相关资产 |
| CWW-P2-2 | AI 生成场景计划/正文/摘要/交接 | 后置 | AI 输出分别落入 ScenePlan、SceneVersion、SceneSummary、SceneHandoff，并由用户确认 current/canon 指针 |
| CWW-P2-3 | ChapterVersionSceneVersion 追溯 | 后置 | ChapterVersion 可追溯由哪些 SceneVersion 装配 |
| CWW-P2-4 | 版本 diff / 重写 | 后置 | 可比较章节版本、场景版本并局部重写 |

---

# P1：AI Draft / Proposal

## 职责

承接 AI 生成内容的草稿 / 建议态，让用户在模块内完成应用、编辑、丢弃、带反馈重生成，再由目标领域模块写入正式表。

## 不负责什么

1. 不调用 LLM。
2. 不拼 Prompt。
3. 不构建 ContextSnapshot。
4. 不直接写其他领域表。
5. 不做全局复杂审核流。
6. 不做多人审批。
7. 不替代 Character / ChapterVersion / Relationship 等正式领域模型。
8. 不把所有创作判断都做成状态、按钮、字段或流程分支。

## 开发规则

1. AI 输出默认进入 GeneratedDraft / Proposal，不得直接写 confirmed/canon 正式数据。
2. 草稿状态只保留 pending、applied、discarded、superseded。
3. 用户动作只保留应用、编辑、丢弃、带反馈重生成。
4. Apply 必须经过目标领域模块 Service，不允许 AI Draft 模块绕过边界直接写目标表。
5. Apply 成功后必须记录 appliedTargetType / appliedTargetId。
6. sourceTaskId 必须可追溯到 GenerationTask。
7. 反馈重生成必须保留 previousDraftId 链路。
8. P1 优先做模块内草稿入口，不做全局待审核队列。
9. Context Builder 默认不读取 pending 草稿，除非用户显式选择。
10. 不新增复杂创作判断状态，开放判断交给自然语言 feedback + 大模型。

## 任务

| 编号 | 任务 | 状态 | 验收标准 |
|---|---|---|---|
| DRAFT-DOC-1 | AI Draft / Proposal 模块设计 | 已做 | `docs/modules/ai-drafts.md` 明确模块定位、非职责、核心概念、状态、动作、Apply 边界和分期 |
| DRAFT-SCHEMA-1 | GeneratedDraft schema 草案评审 | 待做 | 字段覆盖 projectId、targetType、targetId、draftType、payload、textPreview、status、sourceTaskId、feedback、previousDraftId、appliedTargetId 等；不实现复杂审核状态 |
| DRAFT-API-1 | 草稿基础 API | 待做 | 支持按 project/target 查询 pending 草稿，支持详情读取 |
| DRAFT-API-2 | 草稿编辑 / 丢弃 | 待做 | pending 草稿可编辑 payload/textPreview，可标记 discarded |
| DRAFT-API-3 | Apply 用例边界 | 待做 | Apply 不直接跨模块写表，而是调用目标领域模块；成功后记录 appliedTargetType/appliedTargetId |
| DRAFT-API-4 | 反馈重生成入口 | 待做 | 可基于 draftId + feedback 创建新的 GenerationTask，旧草稿 superseded，新草稿 previousDraftId 指向旧草稿 |
| DRAFT-UI-1 | 模块内草稿卡片 | 待做 | Chapter Writing Workspace 内可查看当前章节/场景相关草稿 |
| DRAFT-UI-2 | 四个用户动作 UI | 待做 | UI 只展示应用、编辑、丢弃、带反馈重生成，不展示复杂审核按钮 |
| DRAFT-INT-1 | ChapterVersion Apply 接入 | 待做 | 章节正文草稿应用后创建 ChapterVersion，不直接覆盖当前正文 |
| DRAFT-INT-2 | SceneVersion / ScenePlan Apply 接入 | 待做 | 场景正文草稿写入 SceneVersion；场景计划草稿写入 ScenePlan |
| DRAFT-INT-3 | ChapterSummary Apply 接入 | 待做 | 摘要草稿应用后写入 ChapterSummary，不自动写 MemoryRecord |
| DRAFT-QA-1 | 生命周期测试 | 待做 | 覆盖 pending -> applied/discarded/superseded；非 pending 不可再次操作 |
| DRAFT-QA-2 | 模块边界测试 | 待做 | 验证 Apply 走目标 Service，projectId 不一致时拒绝 |

## P2 / P3 后置

| 编号 | 任务 | 状态 | 验收标准 |
|---|---|---|---|
| DRAFT-P2-1 | 多领域草稿扩展 | 后置 | 支持 Character、Location、Faction、Species、WorldRule、Relationship 等目标类型 |
| DRAFT-P2-2 | 批量草稿 | 后置 | 一个 GenerationTask 可产出多个 GeneratedDraft，并支持简单批量应用/丢弃 |
| DRAFT-P2-3 | draft 参与本次 Context | 后置 | 用户可显式选择 pending draft 参与本次生成，ContextSnapshot 记录 draft sourceRefs |
| DRAFT-P3-1 | 全局草稿队列 | 后置 | 草稿数量变多后提供全局查看和筛选，但不做复杂审批 ERP |

---

# P1：Context Builder

## 职责

把项目资料转为模型可用上下文。

## 开发规则

1. Context Builder 独立模块，不写进 Generation Service。
2. 每次生成必须保存 ContextSnapshot。
3. MVP 先结构化上下文，不做复杂向量 RAG。
4. 未 confirmed 的世界观/事实默认不进入上下文。

## 任务

| 编号 | 任务 | 状态 | 验收标准 |
|---|---|---|---|
| CTX-1 | ContextSnapshot preview | 待做 | 可预览上下文 payload |
| CTX-2 | 项目信息上下文 | 待做 | 读取 Project 信息 |
| CTX-3 | 角色/世界观上下文 | 待做 | 读取 selected/confirmed 资料 |
| CTX-4 | 章节计划上下文 | 待做 | 读取 ChapterPlan |

---

# P1：Prompt 管理

## 职责

管理 Prompt 模板、版本和渲染结果。

## 开发规则

1. Prompt 不散落在业务代码中。
2. 每次生成必须绑定 PromptVersion。
3. 每次实际模型输入必须保存 PromptRender。
4. Prompt 改动必须更新 docs/prompts。

## 任务

| 编号 | 任务 | 状态 | 验收标准 |
|---|---|---|---|
| PROMPT-1 | 默认 Prompt seed | 待做 | generateChapter 等模板入库 |
| PROMPT-2 | Prompt render service | 待做 | 变量渲染可测试 |
| PROMPT-3 | PromptRender 落库 | 待做 | GenerationTask 可追溯 |

---

# P1：LLM Provider 模型接入层

## 职责

为 AI 小说创作工作台提供统一模型接入基础设施。第一版采用 Magpie-first 方案，只向用户开放 Magpie 接入；Mock Provider 仅用于后端开发和测试。

## 开发规则

1. 所有 LLM 调用必须经过 LLM Provider Adapter。
2. 第一版只支持 Magpie，不展示 OpenAI / Anthropic / Gemini / DeepSeek 等未实现 Provider。
3. Magpie 通过本地 Gateway 接入，默认 `http://127.0.0.1:3425/v1`。
4. 必须支持 Magpie 本地服务发现：`GET /api/hello`。
5. 模型列表必须来自 Magpie `/v1/models`，不得硬编码。
6. Gateway Key / API Key 不允许前端回显，不允许写入日志。
7. Secret 必须通过 SecretStore 保存，不得塞进 `LLMProvider.config`。
8. 涉及 schema 修改必须走 Prisma Migrate，并写 migration 文档。
9. 设置页 UI 必须使用 Semi Design，且实现前必须确认交互方案。
10. 不允许在本模块实现 AI 生成章节、Prompt Builder、Context Builder。

## 任务

| 编号 | 任务 | 状态 | 验收标准 |
|---|---|---|---|
| LLM-1 | Magpie 接入文档 | 已做 | `docs/modules/llm-provider.md` 明确 Magpie-first、职责边界、API、UI 草图 |
| LLM-2 | schema 调整 | 已做 | 增加 `LLMProviderType.magpie/mock`、`secretRef`、`deletedAt`、`SecretCredential` |
| LLM-3 | Prisma migration 与文档 | 已做 | 通过 Prisma Migrate 执行，并在 `docs/database/migrations/` 写说明 |
| LLM-4 | SecretStore | 已做 | Gateway Key 加密保存，前端只返回已配置状态 |
| LLM-5 | Adapter 类型定义 | 已做 | `generateText`、`streamText`、`testConnection`、错误类型清晰 |
| LLM-6 | Magpie Discover API | 已做 | 可检测本机 Magpie，并返回 baseUrl/version |
| LLM-7 | Magpie Models API | 已做 | 可从 `/v1/models` 拉取模型列表 |
| LLM-8 | Magpie Adapter | 已做 | 支持 `/v1/chat/completions` 的非流式和流式调用 |
| LLM-9 | Provider CRUD API | 已做 | 可保存 Magpie baseUrl/model/secretRef/config，不回显 key |
| LLM-10 | 测试连接 API | 已做 | 可对已保存或临时配置执行最小请求测试 |
| LLM-11 | Mock Provider | 已做 | 后端测试可不依赖真实 Magpie |
| LLM-12 | 后端测试 | 部分完成 | 已增加 LLM Provider smoke 测试；正式单元测试后续补充 |
| LLM-UI-1 | Semi 设置页交互确认 | 已确认 | 第一版只展示 Magpie，参考 Provider 设置页形态 |
| LLM-UI-2 | Semi 设置页实现 | 已做 | 使用 Semi Design 实现检测、模型刷新、测试、保存；不展示未实现 Provider |
| LLM-P2-1 | 多 Provider 扩展 | P2 | 后续再扩展 OpenAI-compatible 通用 Provider |
| LLM-P2-2 | 项目级模型覆盖 | P2 | 后续支持单个小说项目覆盖全局默认模型 |

---

# P1：生成任务与 SSE

## 职责

管理 AI 生成任务、事件和流式输出。

## 开发规则

1. GenerationTask 必须落库。
2. SSE 不承担业务状态。
3. 重试必须写 GenerationTaskAttempt。
4. 业务代码不直接调用模型 SDK，必须走 LLM Provider。

## 任务

| 编号 | 任务 | 状态 | 验收标准 |
|---|---|---|---|
| GEN-1 | GenerationTask CRUD | 待做 | 可创建/查询任务 |
| GEN-2 | Mock LLM Provider | 待做 | 不接真实模型也可跑通流 |
| GEN-3 | SSE delta | 待做 | 前端能看到流式文本 |
| GEN-4 | 结果保存版本 | 待做 | 输出进入 ChapterVersion |
| GEN-5 | BullMQ 队列化 | P2 | 任务可重试/恢复 |

---

# P2：小说记忆

## 职责

维护长期小说记忆、正史事实、角色状态和关系沉淀。P1 的 ChapterSummary 已在章节模块中完成人工维护与场景摘要汇总；它只是后续记忆沉淀入口，不是长期 MemoryRecord 本体。

## 开发规则

1. Fact 必须有 canonStatus。
2. CharacterState 必须能追溯来源。
3. KnowledgeChunk 只作为 RAG 预留，不在 MVP 依赖。
4. 从 ChapterSummary / SceneSummary 沉淀长期记忆必须走单独的确认流程，不能在 P1 摘要保存时自动写 MemoryRecord / EvidenceRef。

## 任务

| 编号 | 任务 | 状态 | 验收标准 |
|---|---|---|---|
| MEM-1 | 摘要到长期记忆沉淀 | P2 | 可从已确认 ChapterSummary/SceneSummary 人工选择并确认写入长期记忆；P1 不自动写入 |
| MEM-2 | Fact 台账 | P2 | 正史事实可确认 |
| MEM-3 | CharacterState 历史 | P2 | 角色状态可追踪 |
| MEM-4 | Relationship | P2 | 关系可建模 |

---

# P2/P3 后置模块

| 模块 | 优先级 | 说明 |
|---|---|---|
| AI 创建小说 | P2 | LLM 接入后做完整生成/确认流程 |
| 伏笔 | P2 | 依赖章节和事实台账 |
| StoryItem / 剧情道具 | P2 | 后续作为一等实体细化，短期历史 WorldItem item 仅过渡兼容 |
| Location / 地点 | P2 | 后续作为一等实体细化，短期历史 WorldItem location 仅过渡兼容 |
| Faction / 势力 | P2 | 后续作为一等实体细化，短期历史 WorldItem organization 仅过渡兼容 |
| Species / 物种 | P2 | 后续作为一等实体细化，短期历史 WorldItem species 仅过渡兼容 |
| WorldRule / 世界规则 | P2 | 后续作为一等实体细化，短期历史 WorldItem rule 仅过渡兼容 |
| 时间线 | P2 | 后续独立评估，短期历史 WorldItem timeline_event 仅过渡兼容 |
| 实体图谱 | P3 | 依赖 Relationship 成熟 |
| 工作流编辑器 | P3 | 等生成链路稳定后再做 |
| 导出/归档 | P3 | 数据模型稳定后再做 |


---

# P1：Scene / 场景结构模块

## 职责

建立章节内的场景颗粒度，让长篇小说可以按 `Volume / Chapter / Scene` 逐层拆解，并支持写前计划、正文版本、场景摘要、场景交接和轻量写作准备度检查。

Scene 是叙事结构线、故事资产线、读者体验线的交汇点，不是普通章节子表。

## 不负责什么

1. 不做 AI 生成。
2. 不做模型接入。
3. 不做复杂 UI。
4. 不做 Beat 实体。
5. 不做完整 Memory / Continuity 审稿线。
6. 不做 Scene 资产关系表 P1 实现。
7. 不扩展 GenerationTask.sceneId / ContextSnapshot.sceneId。
8. 不生成 ChapterVersionSceneVersion 装配表。

## 开发规则

1. Scene 必须归属 Chapter，不允许跨 Chapter。
2. Scene、ScenePlan、SceneVersion、SceneSummary、SceneHandoff 必须保留 project 边界。
3. 写前计划、正文版本、摘要、交接必须分离。
4. Scene 正文必须进入 SceneVersion，不得直接覆盖 Scene。
5. DELETE 默认软删除，重要创作数据不得物理删除。
6. PATCH 不得深改子实体；activate、reorder、confirm、archive、restore 必须走专门接口。
7. currentPlanId / currentVersionId P1 可不建 Prisma relation，但 Service 层必须校验同 project/chapter/scene 且未软删除。
8. SceneSummary / SceneHandoff 的 Json 字段只能保存摘要、提示、快照结构，不能替代 CharacterState、LocationState、FactionState、WorldRule、Fact、MemoryRecord 或核心关系表。
9. P1 只做 Scene profile 聚合读取和 readiness 轻量检查，不接 ContextSnapshot / GenerationTask / PromptRender。
10. 新增 schema 前必须先评审 `docs/modules/scenes.md` 与本任务拆分。

## 任务

| 编号 | 任务 | 状态 | 验收标准 |
|---|---|---|---|
| SCENE-DOC-1 | Scene 模块设计文档 | 已做 | `docs/modules/scenes.md` 存在，明确职责、边界、P1/P2/P3 分期 |
| SCENE-TASK-1 | Scene 任务拆分 | 已做 | `task-breakdown.md` 包含 Scene 模块职责、规则、任务、验收标准 |
| SCENE-SCHEMA-1 | P1 schema 与 migration | 已做 | schema 覆盖 Scene / ScenePlan / SceneVersion / SceneSummary / SceneHandoff，并已生成 create-only migration |
| SCENE-SCHEMA-2 | schema 审查 | 已做 | 已复核 projectId/chapterId/source/canonStatus/deletedAt/index/relation 边界，无阻塞项 |
| SCENE-API-1 | Scene 基础 API | 已做 | list/create/detail/patch/delete/reorder/confirm/archive/restore 边界清晰 |
| SCENE-API-2 | ScenePlan API | 已做 | plans list/create/update/delete/activate，activate 校验同 scene 且未软删除 |
| SCENE-API-3 | SceneVersion API | 已做 | versions list/create/update/delete/activate，正文版本不直接覆盖 Scene |
| SCENE-API-4 | SceneSummary API | 已做 | summaries CRUD，默认只读未删除记录，confirmed 才进入上下文 |
| SCENE-API-5 | SceneHandoff API | 已做 | handoffs CRUD，固定七类字段，confirmed 才进入下一场上下文 |
| SCENE-API-6 | Scene profile/readiness | 已做 | profile 聚合 scene/currentPlan/currentVersion/latestSummary/latestHandoff/pov/location/readiness |
| SCENE-UI-1 | Scene 轻 UI | 已做 | 可按章节查看场景列表、场景详情、计划、正文版本、摘要与交接；不展示未实现 AI 生成按钮 |
| SCENE-QA-1 | 边界测试 | 已做 | 覆盖 project 边界、软删除、activate、reorder、PATCH 不深改、跨 chapter 拒绝 |

## P2 后置任务

| 编号 | 任务 | 状态 | 验收标准 |
|---|---|---|---|
| SCENE-P2-1 | SceneCharacter | 后置 | 记录场景参与人物和场景内状态 |
| SCENE-P2-2 | SceneLocation | 后置 | 支持多地点和地点在场景中的作用 |
| SCENE-P2-3 | SceneFaction | 后置 | 支持势力参与、影响、读者可见性 |
| SCENE-P2-4 | SceneWorldRule | 后置 | 支持规则 applies/revealed/violated/foreshadowed/exception |
| SCENE-P2-5 | ChapterVersionSceneVersion | 后置 | ChapterVersion 可追溯由哪些 SceneVersion 装配 |
| SCENE-P2-6 | Scene-aware Context Builder | 后置 | ContextSnapshot / GenerationTask 扩展 sceneId 后再接入 |



---

# P1：Relationships / 关系页重构

## 职责

把人物、地点、势力、物种、世界规则、道具、能力等实体的关系信息从基础信息区中独立出来，形成统一的「关系」页签。

关系页负责展示当前实体与其他实体之间的通用关系和已有专用关系摘要，并提供新增通用关系的产品化入口。

## 不负责什么

1. 不大改 schema。
2. 不迁移专用关系表。
3. 不做大型图谱视图。
4. 不做 AI 自动关系抽取。
5. 不做关系时间线演化系统。
6. 不做完整连续性审稿。
7. P1 不强行在一个表单里编辑所有专用关系。

## 开发规则

1. 关系 Tab 是实体详情的一等页签，不再塞进基础信息底部。
2. 关系创建必须通过目标类型和目标对象选择，不允许手填数据库 ID。
3. 关系类型应根据当前实体类型和目标类型动态变化。
4. generic Relationship 和专用关系表应统一展示，但不强行统一存储。
5. 专用关系 P1 可以只读展示或跳转原模块编辑。
6. P1 不做图谱，先做列表和筛选。
7. P1 不接 AI，不做自动抽取。

## 任务

| 编号 | 任务 | 状态 | 验收标准 |
|---|---|---|---|
| REL-DOC-1 | 关系页设计文档 | 已做 | `docs/modules/relationships.md` 存在，明确关系 Tab、EntityRelationsPanel、分期和验收标准 |
| REL-UI-1 | Character 关系 Tab | 待做 | Character 详情中关系独立成 Tab，关系不再挤在基础信息底部 |
| REL-UI-2 | EntityRelationsPanel | 待做 | 可按 entityType/entityId 展示 generic Relationship 列表 |
| REL-UI-3 | 目标对象选择器 | 待做 | 新增关系不手填 ID，可按目标类型搜索选择对象 |
| REL-UI-4 | 动态关系类型 | 待做 | 关系类型随目标类型变化，显示中文产品文案 |
| REL-UI-5 | 专用关系摘要 | 后置 | FactionMembership / FactionRelation / LocationRule 等可在关系 Tab 中统一展示 |
| REL-P2-1 | 专用关系创建入口 | 后置 | 从关系 Tab 创建成员关系、势力关系、规则适用等专用关系 |
| REL-P3-1 | 关系图谱与演化 | 后置 | 局部关系图、时间演化、AI 建议关系后续设计 |
