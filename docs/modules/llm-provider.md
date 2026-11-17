# LLM Provider 模块

## 模块定位

LLM Provider 是 AI 小说创作工作台的模型接入基础设施。

它负责把外部或本地模型网关统一封装成稳定的后端 Adapter，供后续 AI 创建小说、字段改写、章节生成、摘要抽取等生成链路调用。

第一版采用 **Magpie-first** 方案：只面向用户开放 Magpie 接入；Mock Provider 仅用于后端开发和测试。

本模块不是普通 Provider CRUD 后台，也不负责小说生成业务本身。

---

## 职责边界

### 负责

1. 管理模型接入配置。
2. 管理 Provider 启用状态、默认模型、baseUrl、模型名等非敏感信息。
3. 管理 Gateway Key / API Key 的安全保存和读取。
4. 提供统一 Provider Adapter 接口。
5. 支持 Magpie 本地服务发现。
6. 支持从 Magpie 拉取模型列表。
7. 支持测试连接。
8. 为 GenerationTask 提供可追溯的 providerId、model、temperature、tokenUsage。

### 不负责

1. 不负责 Prompt 拼接。
2. 不负责 Context Builder。
3. 不负责章节生成业务流程。
4. 不负责 ChapterVersion 保存。
5. 不负责 SSE 编排。
6. 不负责 AI 创建小说。
7. 不负责 Prompt / Context Builder UI。
8. 不负责 Claude / Gemini / Ollama native 等 Provider 的第一版接入。

生成链路应保持：

```txt
Generation Service
  -> Context Builder
  -> Prompt Render
  -> LLM Provider Adapter
  -> GenerationTask / GenerationEvent / ChapterVersion
```

LLM Provider 只承担模型调用适配层。

---

## 第一版范围

### 做

1. Magpie Provider。
2. Magpie 本地服务发现。
3. Magpie 模型列表拉取。
4. Magpie 测试连接。
5. Gateway Key 安全保存。
6. Mock Provider 后端测试能力。
7. Provider CRUD API。
8. 后续设置页所需 API。

### 不做

1. OpenAI / Anthropic / Gemini / DeepSeek 独立供应商。
2. Ollama native 接入。
3. Claude / Gemini native 协议接入。
4. AI 生成章节。
5. AI 创建小说。
6. Prompt 管理 UI。
7. Context Builder UI。
8. Provider 市场。
9. 自动安装 Magpie。
10. 未确认的设置页 UI 实现。

---

## Magpie 接入方式

Magpie 是本地 LLM Gateway。第一版将 Magpie 作为工作台的模型网关。

默认本地服务：

```txt
http://127.0.0.1:3425
```

OpenAI-compatible baseUrl：

```txt
http://127.0.0.1:3425/v1
```

需要支持的接口：

```txt
GET  /api/hello
GET  /v1/models
POST /v1/chat/completions
```

### 服务发现

后端应提供 Magpie discover 能力：

1. 只读 `~/.config/magpie/settings.json` 中的 `port`。
2. 如果读取失败，使用默认端口 `3425`。
3. 请求 `GET http://127.0.0.1:<port>/api/hello`。
4. 返回 `name = magpie` 时视为检测成功。
5. 自动推导 baseUrl：`http://127.0.0.1:<port>/v1`。

不得写入 Magpie 配置文件。

### Gateway Key

本机 Magpie 调用允许使用应用标识形式的 key，例如：

```txt
magpie-ai-novel-workbench
```

远程 / 局域网 Magpie 需要用户在 Magpie 中创建 Gateway Key。

因此第一版仍必须按敏感信息处理 Gateway Key：

1. 不明文入库。
2. 不在前端回显。
3. 不写入日志。
4. 不放入 GenerationTask.input/output/error。
5. 前端只显示“已配置 / 未配置”。

---

## 数据模型建议

### Provider 类型

第一版建议：

```prisma
enum LLMProviderType {
  magpie
  mock
}
```

### LLMProvider

```prisma
model LLMProvider {
  id        String          @id @default(cuid())
  projectId String?
  name      String
  type      LLMProviderType
  baseUrl   String?
  model     String
  config    Json?
  secretRef String?
  isDefault Boolean         @default(false)
  isEnabled Boolean         @default(true)
  createdAt DateTime        @default(now())
  updatedAt DateTime        @updatedAt
  deletedAt DateTime?

  project         Project?         @relation(fields: [projectId], references: [id], onDelete: Cascade)
  generationTasks GenerationTask[]

  @@index([projectId, isEnabled])
  @@index([projectId, isDefault])
  @@index([deletedAt])
}
```

### SecretCredential

Gateway Key / API Key 需要独立 SecretStore，不得直接塞入 `LLMProvider.config`。

```prisma
model SecretCredential {
  id             String   @id @default(cuid())
  ref            String   @unique
  encryptedValue String
  iv             String
  authTag        String?
  algorithm      String
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
}
```

`LLMProvider.secretRef` 建议格式：

```txt
llm-provider:<providerId>:gateway-key
```

所有 schema 变更必须通过 Prisma Migrate，并在 `docs/database/migrations/` 写 migration 文档。

---

## SecretStore 接口

```ts
export interface SecretStore {
  setSecret(ref: string, value: string): Promise<void>
  getSecret(ref: string): Promise<string | null>
  deleteSecret(ref: string): Promise<void>
  hasSecret(ref: string): Promise<boolean>
}
```

第一版建议实现：

```txt
DatabaseSecretStore
```

要求：

1. 使用后端 master key 加密保存。
2. master key 不进入业务表。
3. 本地开发可生成 `.local` master key，并加入 `.gitignore`。
4. 返回给前端时只返回 `hasApiKey` / `hasGatewayKey`。

---

## Adapter 接口

业务模块不得直接调用 Magpie HTTP API，必须通过统一 Adapter。

```ts
export interface LlmProviderAdapter {
  readonly type: LLMProviderType

  generateText(input: GenerateTextInput): Promise<GenerateTextResult>

  streamText(input: StreamTextInput): AsyncIterable<LlmStreamEvent>

  testConnection(input: TestConnectionInput): Promise<TestConnectionResult>
}
```

### 输入

```ts
export type LlmMessage = {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export type GenerateTextInput = {
  provider: ResolvedLLMProvider
  messages: LlmMessage[]
  temperature?: number
  maxTokens?: number
  abortSignal?: AbortSignal
  metadata?: {
    projectId?: string
    taskId?: string
    purpose?: string
  }
}
```

### Resolved Provider

Adapter 不直接查数据库，不直接查 Secret。

```ts
export type ResolvedLLMProvider = {
  id: string
  type: 'magpie' | 'mock'
  name: string
  baseUrl?: string
  model: string
  gatewayKey?: string
  config?: unknown
}
```

### 流式事件

```ts
export type LlmStreamEvent =
  | { type: 'start'; providerId: string; model: string }
  | { type: 'delta'; text: string }
  | { type: 'usage'; tokenUsage: TokenUsage }
  | { type: 'done'; finishReason?: string }
  | { type: 'error'; error: LlmProviderError }
```

---

## API 设计

### Provider CRUD

```txt
GET    /llm-providers
POST   /llm-providers
GET    /llm-providers/:id
PATCH  /llm-providers/:id
DELETE /llm-providers/:id
POST   /llm-providers/:id/set-default
POST   /llm-providers/:id/test
```

返回 Provider 时不得包含 Gateway Key 原文。

### Magpie discover

```txt
GET /llm-providers/magpie/discover
```

返回：

```ts
{
  found: boolean
  baseUrl?: string
  version?: string
  message: string
}
```

### Magpie models

```txt
POST /llm-providers/magpie/models
```

body：

```ts
{
  baseUrl: string
  gatewayKey?: string
}
```

内部请求：

```txt
GET <baseUrl>/models
Authorization: Bearer <gatewayKey>
```

模型 id 必须来自 Magpie `/v1/models`，不在工作台内硬编码模型列表。

---

## 测试连接

测试连接使用最小 chat completion：

```json
{
  "messages": [
    {
      "role": "user",
      "content": "Reply with exactly: OK"
    }
  ],
  "temperature": 0,
  "max_tokens": 8
}
```

成功标准：

1. HTTP 请求成功。
2. Provider 返回文本。
3. 能解析 tokenUsage 则记录，不能解析不视为失败。

错误必须结构化：

```ts
type LlmProviderErrorCode =
  | 'MISSING_GATEWAY_KEY'
  | 'INVALID_BASE_URL'
  | 'AUTH_FAILED'
  | 'MODEL_NOT_FOUND'
  | 'RATE_LIMITED'
  | 'TIMEOUT'
  | 'NETWORK_ERROR'
  | 'PROVIDER_ERROR'
  | 'UNKNOWN'
```

---

## Mock Provider

Mock Provider 只作为后端开发与测试能力，不在第一版普通设置页展示。

用途：

1. 不接真实模型也能跑通 Adapter。
2. 测试 GenerationTask。
3. 测试 SSE delta。
4. 测试错误处理。

---

## 设置页 UI 草图

设置页 UI 必须使用 Semi Design。

开发 Semi UI 前必须查询 Semi Design MCP 或官方文档，不允许凭印象编造组件属性。

第一版 UI 只展示 Magpie，不展示 OpenAI / Anthropic / Gemini / DeepSeek / 自定义 Provider 等未实现入口。

草图：

```txt
设置 / 模型接入

┌───────────────────────────────────────────────┐
│ 模型接入                                      │
├─────────────────┬─────────────────────────────┤
│ Magpie          │ Magpie            已启用      │
│                 │                             │
│                 │ 通过 Magpie 本地网关使用你    │
│                 │ 已经配置好的模型。            │
│                 │                             │
│                 │ 连接状态  已检测到 / 未检测到 │
│                 │ [检测本机 Magpie]             │
│                 │                             │
│                 │ API 代理端点                  │
│                 │ [http://127.0.0.1:3425/v1]   │
│                 │                             │
│                 │ Gateway Key                  │
│                 │ [••••••••••••]               │
│                 │                             │
│                 │ 模型                          │
│                 │ [选择模型              v]     │
│                 │ [刷新模型列表]                │
│                 │                             │
│                 │ [测试连接] [保存]             │
└─────────────────┴─────────────────────────────┘
```

交互规则：

1. 点击“检测本机 Magpie”后调用 discover API。
2. 检测成功后自动填入 baseUrl。
3. 点击“刷新模型列表”后调用 models API。
4. 保存后 Gateway Key 不回显，只显示已配置。
5. 测试连接失败必须显示用户能理解的错误，不暴露堆栈。
6. 不显示未实现功能的可执行按钮。
7. 不在正式 UI 中出现技术栈、TODO、接口状态等开发文案。

UI 实现必须等交互方案确认后再开始。
