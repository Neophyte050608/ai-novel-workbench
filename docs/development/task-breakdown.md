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
| INFO-1 | 信息页分组布局 | 待做 | 四组信息清晰展示 |
| INFO-2 | 字段编辑 | 待做 | 字段可修改并保存 |
| INFO-3 | 类型/标签编辑 | 待做 | 关联表更新正确 |
| INFO-4 | 字段级展示组件 | 待做 | FieldBlock 可复用 |
| INFO-5 | AI 改写占位规则 | 后置 | 模型未接入时不显示假按钮 |

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
| CHAR-1 | 人物列表 | 待做 | 可查看当前项目人物 |
| CHAR-2 | 新建人物 | 待做 | 创建后带 projectId |
| CHAR-3 | 人物详情 | 待做 | 展示基础档案 |
| CHAR-4 | 人物状态记录 | 待做 | 可新增状态快照 |
| CHAR-5 | 关系管理 | P2 | 使用 Relationship 关联人物 |

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
| WORLD-DOC-1 | 世界观实体拆分文档 | 初版已做 | `world-items.md` 明确 WorldItem 收窄与一等实体方向，不代表实现完成 |
| WORLD-LOC-1 | Location 模块设计 | 初版已做 | 明确地点职责边界、字段方向、Relationship 关系，不代表实现完成 |
| WORLD-FAC-1 | Faction 模块设计 | 初版已做 | 明确势力职责边界、字段方向、Relationship 关系，不代表实现完成 |
| WORLD-SPEC-1 | Species 模块设计 | 初版已做 | 明确物种职责边界、字段方向、Relationship 关系，不代表实现完成 |
| WORLD-ITEM-1 | StoryItem 模块设计 | 初版已做 | 明确剧情道具职责边界、字段方向、Relationship 关系，不代表实现完成 |
| WORLD-RULE-1 | WorldRule 模块设计 | 初版已做 | 明确规则职责边界、字段方向、Relationship 关系，不代表实现完成 |
| WORLD-GEN-1 | WorldItem 通用设定列表 | 待做 | 可查看通用世界设定，避免混入一等实体 |
| WORLD-GEN-2 | WorldItem 新建通用设定 | 待做 | 支持体系/历史/文化/概念/社会制度/自定义等通用类型 |
| WORLD-GEN-3 | WorldItem 详情与 canonStatus | 待做 | 展示 summary/content 并可切换 draft/confirmed/archived |
| WORLD-REL-1 | 世界观 Relationship 连接策略 | P2 | 可连接角色、地点、势力、物种、道具、规则和通用设定 |

---

# P1：大纲规划模块

## 职责

管理分卷和章节计划。

## 开发规则

1. `Volume` 和 `ChapterPlan` 不得混进 Chapter 正文。
2. 生成章节前应优先读取 ChapterPlan。
3. MVP 先做 Volume + ChapterPlan，不急着做 Arc/Scene。

## 任务

| 编号 | 任务 | 状态 | 验收标准 |
|---|---|---|---|
| PLAN-1 | 分卷列表 | 待做 | 可创建/排序 Volume |
| PLAN-2 | 章节计划列表 | 待做 | ChapterPlan 可归属 Project/Chapter |
| PLAN-3 | 计划详情编辑 | 待做 | goal/outline/pov/constraints 可编辑 |
| PLAN-4 | 从计划创建章节 | 待做 | Chapter 与 ChapterPlan 建立关系 |

---

# P1：章节正文与版本

## 职责

管理章节正文、版本历史和当前版本。

## 开发规则

1. AI 生成结果必须进入 ChapterVersion。
2. 不得直接覆盖 Chapter 正文。
3. 手动编辑也应形成版本或明确保存策略。
4. ChapterSummary 后续进入小说记忆。

## 任务

| 编号 | 任务 | 状态 | 验收标准 |
|---|---|---|---|
| CHAP-1 | 章节列表 | 待做 | 按项目展示章节 |
| CHAP-2 | 章节编辑器 | 待做 | 可编辑正文 |
| CHAP-3 | 版本保存 | 待做 | 保存生成 ChapterVersion |
| CHAP-4 | 激活版本 | 待做 | 可设置当前版本 |
| CHAP-5 | 章节摘要 | P2 | 保存 ChapterSummary |

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

维护章节摘要、正史事实、角色状态、关系。

## 开发规则

1. Fact 必须有 canonStatus。
2. CharacterState 必须能追溯来源。
3. KnowledgeChunk 只作为 RAG 预留，不在 MVP 依赖。

## 任务

| 编号 | 任务 | 状态 | 验收标准 |
|---|---|---|---|
| MEM-1 | ChapterSummary | P2 | 章节摘要可保存 |
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
