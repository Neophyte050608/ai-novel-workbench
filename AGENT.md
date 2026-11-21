# AGENT.md

本项目是 AI 小说生成/创作工作台。

技术栈：
- Frontend: React + TypeScript + Semi Design
- Backend: NestJS + TypeScript
- Database: PostgreSQL + Prisma
- Queue: Redis + BullMQ
- Streaming: SSE
- Context: Structured Context Builder first, pgvector reserved

## 1. 总体原则

1. 不允许绕过模块边界直接跨模块访问数据库。
2. 不允许在 Controller 中写业务逻辑。
3. 不允许在前端拼接核心 Prompt。
4. 不允许把 Prompt 文本散落在业务代码中。
5. 所有 LLM 调用必须经过 LLM Provider Adapter。
6. 对数据库连接、认证、云服务、支付、存储、消息队列等已有成熟官方或权威 SDK/Client 的能力，必须优先使用 SDK/Client，不得手写协议、连接管理、签名、重试、分页、鉴权等底层逻辑；只有在 SDK 缺失或无法满足项目边界时，才允许封装最小自研实现，并在文档中说明原因、风险和测试覆盖。
7. 所有生成任务必须落库。
8. 所有章节生成结果必须保存为 ChapterVersion，不得直接覆盖当前正文。
9. 所有数据库结构变更必须通过 Prisma migration。
10. 所有 Prompt 改动必须更新 Prompt 版本文档。
11. MVP 不引入多人协作、实时协同编辑、复杂权限模型。

## 2. 前端约束

1. UI 组件优先使用 Semi Design。
2. 页面级代码放在 `apps/web/src/pages`。
3. 业务功能代码放在 `apps/web/src/features`。
4. 跨功能通用组件放在 `apps/web/src/shared/ui`。
5. API 请求必须通过 `shared/api` 封装。
6. SSE 连接逻辑必须封装在 generation feature 内，不得散落在页面组件中。
7. 页面组件不得直接包含复杂数据转换逻辑。

## 3. 后端约束

1. NestJS 模块必须按业务边界组织。
2. Controller 只处理请求、响应、DTO 校验。
3. Service 处理应用用例，不直接拼 Prompt。
4. Context Builder 独立为模块，不写在 Generation Service 内。
5. Prompt 渲染由 Prompts 模块负责。
6. LLM SDK 只能在 infrastructure/llm 内使用。
7. BullMQ Processor 只负责任务执行编排，不承载核心领域逻辑。
8. Prisma Client 只能通过 PrismaService 注入使用。

## 4. 数据库约束

1. 所有表必须包含 `id`, `createdAt`, `updatedAt`。
2. 所有项目内资源必须包含 `projectId`。
3. 不直接删除重要创作数据，优先使用软删除字段。
4. 章节正文变更必须通过 ChapterVersion 记录。
5. 生成任务和 Prompt 版本必须可追溯。
6. 预留 pgvector，但 MVP 不强依赖 embedding。

## 5. Prompt 约束

1. Prompt 文件统一放在 `docs/prompts` 或 `packages/prompt-spec`。
2. Prompt 版本号格式：`<domain>.<task>.v<major>.<minor>.<patch>`。
3. 破坏性改动升级 major。
4. 输出格式变化必须记录。
5. 每个 Prompt 必须包含：目标、输入变量、输出格式、约束、示例、版本变更记录。

## 6. SSE 约束

1. SSE 事件必须使用统一事件类型。
2. 错误必须发送结构化 error event。
3. SSE 中断不得导致任务状态丢失。
4. 前端必须支持根据 taskId 查询最终任务状态。
5. 不允许把完整业务状态只存在内存中。

## 7. 文档约束

1. 架构决策必须写 ADR。
2. 新增核心模块必须有模块设计文档。
3. 数据库 migration 必须配套说明。
4. Prompt 改动必须配套版本说明。
5. 接口变化必须更新 API 文档。
6. 新增或修改实体 API 前，必须遵守 `docs/development/entity-api-principles.md`，确保基础 CRUD 同时服务 AI 草稿、Context Builder、批量编排和错误重试。

## 8. 测试约束

1. Context Builder 必须有单元测试。
2. Prompt 渲染必须有快照或结构测试。
3. Generation Service 必须 mock LLM Provider。
4. SSE 事件格式必须有契约测试。
5. Prisma migration 不允许手写未审查 SQL。

## 9. 数据库迁移规范

1. `apps/api/prisma/schema.prisma` 是业务数据模型的唯一主入口。
2. MVP 阶段不使用 Flyway，统一使用 Prisma Migrate 管理业务 schema 变更。
3. 普通表、字段、关系、enum 变更必须通过 Prisma Migrate。
4. 不允许直接手写 SQL 修改业务表结构，除非 Prisma 无法表达。
5. 复杂 PostgreSQL 能力，例如 pgvector、特殊 index、trigger、view，可以使用 Prisma migration 中的 raw SQL。
6. 已提交或已执行的 migration 不允许重写历史，只能新增 migration 修正。
7. 每个 migration 必须有语义化名称。
8. 每个重要 migration 必须在 `docs/database/migrations/` 下写说明。
9. migration 文档必须包含：背景、变更内容、数据迁移策略、回滚策略、风险、验证方式。
10. 所有 schema 变更后必须运行：`pnpm db:generate`、`pnpm db:migrate`、相关类型检查或测试。
11. 生产数据迁移必须优先考虑向后兼容，不允许直接删除有用数据字段。

## 10. 架构演进约束

1. 允许分阶段实现，但不允许为了 MVP 破坏长期模块边界。
2. “轻实现”只能轻在功能完整度，不能轻在数据模型、追溯链路和模块职责。
3. 如果一个领域在成熟形态下天然独立，例如 Planning、Novel Memory、LLM Provider、Prompt Render、Generation Attempt，应优先建立独立模型或接口，再逐步补功能。
4. 不允许先用临时字段或自由 JSON 混过核心关系，导致后续迁移需要兼容大量历史脏数据。
5. 可以先不做复杂 UI，但后端领域模型和生命周期必须按长期目标设计。
6. AI 生成链路必须从一开始保留可追溯关系：GenerationTask -> ContextSnapshot -> PromptVersion/PromptRender -> LLMProvider -> ChapterVersion。
7. 对暂缓模块必须在 docs 中说明未来扩展方向，不能只留 TODO。
8. 当“简单实现”和“长期可维护边界”冲突时，优先长期边界。

## 11. Semi Design MCP 约束

1. 开发 Semi Design UI 时，应优先使用项目配置的 `semi-design` MCP 查询组件 API 和示例。
2. 不允许凭印象编造 Semi 组件属性；不确定时先查 MCP 或官方文档。
3. Semi 组件使用方式如果和 TypeScript 类型冲突，以类型检查和 MCP 文档为准。
4. 常用复杂组件，例如 Form、Table、Modal、SideSheet、Tree、Tabs、Nav，应在实现前确认 API。

## 12. 产品交互约束

1. 本项目不是普通 CRUD 后台，而是 AI 小说创作工作台。
2. 前端信息架构分为两层：书架层和小说工作台层。
3. 书架层只负责查看/切换/新建/删除小说，不展示人物、世界观、伏笔、章节等项目内资源。
4. 人物、世界观、势力、地点、道具、伏笔、时间线、小说记忆、生成任务必须归属于某个 Project，只能在工作台层出现。
5. 新建小说不是 Modal 表单，必须是创作入口；包含手动创建和 AI 创建两个入口。
6. AI 创建在模型未接入前只能显示“即将接入”，不得假装已实现。
7. 页面上不展示未实现功能的可执行按钮；工作台导航骨架可以展示，但不能误导用户功能已完成。
8. 类型和标签必须来自 Genre / Tag 有限表，不允许长期使用自由文本类型字段。
9. 涉及信息架构、新页面入口、工作台导航、新建小说流程、AI 生成流程的 UI 改动，必须先画交互图或说明并等待用户确认。
10. 正式 UI 不出现技术栈、TODO、接口状态、开发计划等开发文案。

详见 `docs/development/interaction-principles.md`。

## 13. 开发任务拆分约束

1. 开发必须按 `docs/development/task-breakdown.md` 的模块推进。
2. 新增模块前必须先补任务拆分和模块规则。
3. 每个模块必须明确：职责、不负责什么、开发规则、验收标准。
4. 不允许跨模块随手实现功能；如果需要跨模块，先说明依赖关系。
5. P0/P1 未完成前，不做 P3 高级能力。
6. 每完成一个任务，应更新任务状态或在回复中明确说明未更新原因。

