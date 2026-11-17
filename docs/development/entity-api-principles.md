# 实体 API 原则

本项目的 API 不是普通后台 CRUD，而是服务 AI 小说创作工作台的实体 API。所有人物、世界观、章节计划、事实、关系、地点、势力、物种、道具、规则等基础实体 API，都必须为后续 AI 编排、草稿确认、上下文读取和错误重试服务。

## 1. 适用范围

本文适用于所有项目内实体 API 的设计、实现和重构，包括但不限于：

- Project 下的创作资料实体。
- 人物、人物状态、人物身份、关系。
- 世界观相关实体，例如 Location、Faction、Species、StoryItem、WorldRule、WorldItem。
- 大纲、章节计划、事实、记忆、伏笔等后续模块。

新增或修改实体 API 前，必须先确认本文规则。即使当前只实现手动编辑，也要预留 AI 草稿、Context Builder 和批量编排需要的语义边界。

## 2. 实体 API 不是普通 CRUD

普通 CRUD 只关心用户对单条数据的增删改查；本项目的实体 API 还必须同时服务：

1. **前端手动编辑**：用户在工作台中创建、编辑、筛选、确认、归档实体。
2. **AI 草稿生成 / 补全**：模型输出人物、世界观、关系、状态、事实等候选内容，默认以草稿进入系统。
3. **Context Builder 读取**：生成章节、补全设定或检查一致性时，需要读取 confirmed 实体及必要聚合信息。
4. **批量编排**：AI 创建小说、章节总结、记忆沉淀、实体抽取等流程会批量写入多个实体，并需要可恢复、可去重、可部分成功。

因此，实体 API 的目标不是“把表暴露成 HTTP CRUD”，而是为创作资料生命周期提供稳定入口。

## 3. 通用 API 能力

每个实体模块应按长期方向评估以下能力。MVP 可以分阶段实现，但文档和接口边界不得与这些能力冲突。

### 3.1 基础 CRUD

- `create`：创建实体，必须绑定 `projectId`。
- `list`：按 `projectId` 列表读取，支持必要筛选、排序和分页。
- `get`：读取单个实体，并校验 `projectId` 边界。
- `patch`：修改主实体基础字段；不得滥用为任意深层写入入口。
- `delete`：默认软删除，不直接物理删除重要创作数据。

### 3.2 draft-first 生命周期

实体应支持类似生命周期：

- `draft`：草稿，AI 生成或用户暂存内容默认状态。
- `confirmed`：用户确认后进入正史 / 可默认进入上下文的状态。
- `archived`：不再活跃使用，但仍保留历史和追溯价值。

AI 写入必须默认 `draft`，不得绕过用户确认直接进入 `confirmed`。

### 3.3 来源追踪

实体应尽量包含来源追踪字段：

- `sourceType`：来源类型，例如 `user`、`generation_task`、`imported`、`chapter_summary`、`entity_extraction`。
- `sourceId`：来源记录 ID，例如 GenerationTask ID、导入任务 ID、章节摘要 ID。

AI、导入、批量抽取等非纯手动写入场景中，`sourceType` / `sourceId` 必填或应尽量携带。缺失来源会削弱去重、审计、回滚和问题排查能力。

### 3.4 profile / aggregate 聚合读取

实体 Service 需要提供面向 Context Builder 和详情页的聚合读取能力，例如：

- `getProfile(projectId, entityId)`：读取主实体及摘要化关联信息。
- `getContext(projectId, entityId, options)`：读取适合模型上下文的结构化信息。
- `listForContext(projectId, filters)`：按重要度、状态、选择范围读取上下文候选。

聚合读取不等于前端详情页必须一次展示所有内容，但 Service 层应具备稳定组合能力，避免 Context Builder 通过 HTTP 反调或自行拼接跨模块数据库查询。

### 3.5 batch draft import

实体模块应预留批量草稿导入能力，用于 AI 编排或导入流程：

- 一次导入多条候选实体。
- 默认写入 `draft`。
- 每条候选都能携带 `sourceType` / `sourceId`、`clientRequestId`、`dedupeKey`。
- 返回每条的成功、失败、重复、跳过状态。

### 3.6 confirm / archive

确认和归档应使用明确 API 或 Service 方法表达，不建议只靠通用 PATCH 模糊修改：

- `confirm`：用户确认草稿进入 `confirmed`。
- `archive`：实体退出活跃使用，但保留历史。
- `restore`：如需要，可从 archived 或软删除状态恢复。

### 3.7 软删除

重要创作数据默认软删除：

- 删除时设置 `deletedAt` 或等价字段。
- 普通列表默认过滤软删除数据。
- 内部审计、恢复、冲突处理可以读取软删除数据。

### 3.8 projectId 边界

所有项目内实体 API 必须以 `projectId` 作为访问边界：

- 创建时写入 `projectId`。
- 读取、更新、删除时校验实体属于当前 `projectId`。
- 批量导入时所有输入必须归属于同一 `projectId`。
- 关系写入时两端实体必须在允许的项目边界内。

不得只凭实体 ID 跨项目读取或修改。

### 3.9 筛选 / 分页

列表 API 应支持必要筛选和分页，避免 Context Builder、前端列表和 AI 编排读取无边界数据：

- `canonStatus` / 状态筛选。
- `sourceType` / `sourceId` 筛选。
- `deleted` / `archived` 筛选。
- 名称、类型、重要度、更新时间等排序。
- `limit` / `cursor` 或 `page` / `pageSize`。

## 4. AI 写入规则

1. AI 生成、AI 补全、实体抽取、章节总结沉淀出来的实体，默认必须进入 `draft`。
2. AI 不得直接把实体写成 `confirmed`，除非后续有明确的用户确认或人工审核动作。
3. AI 写入必须携带或尽量携带 `sourceType` / `sourceId`。
4. 用户确认后，实体才能从 `draft` 切换为 `confirmed`。
5. 如果 AI 结果与已有 confirmed 内容冲突，应生成 draft 或冲突提示，不应静默覆盖 confirmed 内容。
6. AI 更新 confirmed 实体时，应优先生成补丁草稿、候选版本或待确认变更，而不是直接覆盖正史字段。

## 5. 编排友好规则

AI 创建小说、章节后处理、实体抽取和记忆沉淀都可能一次处理多个实体。实体 API / Service 应为编排预留以下能力。

### 5.1 嵌套创建

在明确边界内，可以支持嵌套创建草稿，例如：

- 创建 Character draft 时附带 CharacterIdentity draft。
- 导入 Location draft 时附带候选 Relationship draft。
- 章节总结后批量生成 Fact draft 和 CharacterState draft。

嵌套创建必须保持主从边界清晰：主实体创建失败时，其子草稿不应孤立落库；子项失败时应能在返回结果中定位。

### 5.2 批量草稿

批量写入应优先写 draft，不直接写 confirmed。返回结果应能表达：

- `created`：成功创建。
- `updated`：幂等命中后更新或合并。
- `duplicate`：识别为重复草稿，未重复创建。
- `skipped`：因规则跳过。
- `failed`：该条失败，并携带结构化错误。

### 5.3 幂等 / 去重建议

编排任务可能重试，同一批候选可能重复提交。应预留：

- `clientRequestId`：客户端或编排器本次请求 ID，用于请求级追踪。
- `dedupeKey`：候选实体级去重键，例如 `sourceType + sourceId + normalizedName + entityType`。
- 来源链路去重：同一 GenerationTask 或导入任务重复执行时，不应无限制造重复草稿。

MVP 可以先只在文档和 DTO 命名中预留，但不得设计成无法加幂等的形态。

### 5.4 部分成功 / 失败返回策略

批量 API 不应只有整体 200 或整体 500。推荐返回：

```json
{
  "requestId": "req_123",
  "summary": {
    "total": 3,
    "created": 1,
    "duplicate": 1,
    "failed": 1
  },
  "items": [
    {
      "index": 0,
      "status": "created",
      "id": "char_1"
    },
    {
      "index": 1,
      "status": "duplicate",
      "id": "char_2",
      "dedupeKey": "generation_task:task_1:character:lin-xuan"
    },
    {
      "index": 2,
      "status": "failed",
      "error": {
        "code": "RELATION_NOT_FOUND",
        "message": "关联的 factionId 不存在或不属于当前 project。",
        "retryable": false,
        "action": "修正 factionId 后重新提交该条目。",
        "fields": ["items[2].factionId"],
        "details": {
          "factionId": "fac_missing"
        }
      }
    }
  ]
}
```

这样 AI 编排器可以只重试失败项，用户也能看到哪些候选需要修正。

## 6. Context Builder 规则

1. Context Builder 不要通过 HTTP 调用本项目自己的实体 API。
2. Context Builder 应使用内部 Service 或领域查询接口读取实体。
3. 实体 Service 需提供 context / profile 聚合读取能力，避免 Context Builder 自己跨模块拼 SQL。
4. Context Builder 默认读取 `confirmed` 内容；读取 draft 必须由明确用户选择、生成任务策略或调试模式触发。
5. Context Builder 读取应尊重 `projectId`、软删除、归档、重要度和筛选条件。
6. 聚合读取应输出结构化对象，而不是只输出自由文本，Prompt 渲染阶段再决定如何转为文本。

## 7. PATCH 边界

主实体 PATCH 只用于修改主实体自己的基础字段。不得把 PATCH 设计成万能入口。

### 7.1 主实体 PATCH 不直接写子实体 / 关系

例如：

- `PATCH /characters/:id` 不应直接创建或删除 CharacterIdentity。
- `PATCH /characters/:id` 不应直接批量改 Relationship。
- `PATCH /locations/:id` 不应直接创建 Faction 或跨实体关系。

子实体和关系应走专门 API 或专门 Service 方法，例如：

- `POST /characters/:id/identities`
- `POST /characters/:id/states`
- `POST /relationships`
- `POST /entities/batch-drafts`

### 7.2 状态 / 身份 / 规则等走专门 API

以下内容不应长期塞进主实体 PATCH：

- 人物状态历史。
- 多身份。
- 关系图。
- 世界规则条目。
- 章节事实沉淀。
- confirmed / archived 等生命周期动作。

生命周期动作建议使用 `confirm` / `archive` / `restore` 等明确接口或 Service 方法，便于审计、权限、编排和错误处理。

## 8. 软删除和归档区别

软删除和归档不是同一件事：

| 概念 | 含义 | 默认列表 | Context Builder | 可恢复性 | 典型场景 |
|---|---|---|---|---|---|
| `archived` | 不再活跃使用，但仍是有意义历史资料 | 可按筛选查看，默认可隐藏 | 默认不进入，除非显式需要历史 | 应可恢复为 draft/confirmed | 废弃设定、旧身份、过期状态、弃用关系 |
| `deletedAt` 软删除 | 用户删除或系统隐藏，主要用于恢复和审计 | 默认不显示 | 默认不读取 | 可由恢复能力处理 | 误删恢复、审计、避免物理删除重要创作数据 |

归档是创作生命周期状态；软删除是数据保留和恢复策略。不要用软删除替代归档，也不要用归档模拟删除。

## 9. 统一错误返回格式

实体 API 的错误返回必须便于前端展示，也要便于 AI 编排器判断是否可重试、是否需要修正输入。

推荐格式：

```json
{
  "requestId": "req_123",
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "角色名称不能为空。",
    "retryable": false,
    "action": "请补充 name 字段后重新提交。",
    "fields": ["name"],
    "details": {
      "minLength": 1
    }
  }
}
```

字段说明：

| 字段 | 必填 | 说明 |
|---|---:|---|
| `requestId` | 是 | 请求追踪 ID，用于日志、前端反馈和 AI 重试关联。 |
| `error.code` | 是 | 稳定错误码，AI 和前端不应依赖自然语言 message 判断。 |
| `error.message` | 是 | 面向用户或开发者的可读说明。 |
| `error.retryable` | 是 | 当前请求原样或近似原样重试是否可能成功。 |
| `error.action` | 是 | 建议下一步动作，例如修正字段、刷新后重试、稍后重试。 |
| `error.fields` | 是 | 相关输入字段路径；无字段关联时为空数组。 |
| `error.details` | 是 | 结构化调试信息，不应包含密钥或敏感 Prompt 全文。 |

### 9.1 标准错误码

| code | retryable | 处理建议 |
|---|---:|---|
| `VALIDATION_ERROR` | false | 输入格式、必填项、枚举值、长度等错误；必须修正输入后再提交。 |
| `NOT_FOUND` | false | 目标实体不存在、已删除或不属于当前 project；需要刷新数据或修正 ID。 |
| `CONFLICT` | false | 与现有 confirmed 数据或唯一约束冲突；需要用户选择合并、改名、归档或创建新草稿。 |
| `STALE_WRITE` | true | 基于旧版本写入；应重新读取最新实体后合并再提交。原请求直接重放通常不安全。 |
| `RELATION_NOT_FOUND` | false | 关系端点不存在或跨 project；需要修正关联 ID。 |
| `DUPLICATE_DRAFT` | false | 已存在相同来源或 dedupeKey 的草稿；应复用已有草稿、合并或跳过，不应继续重试创建。 |
| `TRANSIENT_ERROR` | true | 数据库短暂不可用、队列超时、外部依赖短暂失败；可退避后重试。 |

### 9.2 可重试与需修正输入

可重试错误：

- `TRANSIENT_ERROR`：可使用指数退避重试。
- `STALE_WRITE`：可重试，但必须先刷新最新数据并重新计算补丁；不建议原样重放。

需要修正输入或改变策略的错误：

- `VALIDATION_ERROR`：修正字段。
- `NOT_FOUND`：刷新或替换 ID。
- `CONFLICT`：合并、改名、归档旧项或改为引用已有项。
- `RELATION_NOT_FOUND`：修正关系端点。
- `DUPLICATE_DRAFT`：复用、合并或跳过已有草稿。

### 9.3 批量场景错误

批量 API 应在每个失败 item 中嵌入同样结构的 `error` 对象。整体请求只有在请求体无法解析、鉴权失败、project 边界整体非法等情况下才整体失败。

## 10. 实施要求

1. 新增或修改实体 API 前，必须先检查本文。
2. 模块文档中应说明本模块如何遵循 draft-first、来源追踪、Context Builder 读取和 projectId 边界。
3. API 文档中应明确错误码和重试策略。
4. Service 层设计必须考虑 Context Builder 内部调用，不允许只设计 HTTP Controller。
5. 不允许为了 MVP 把 AI 草稿、确认、聚合读取、批量导入和错误重试设计成后续无法兼容的形态。
