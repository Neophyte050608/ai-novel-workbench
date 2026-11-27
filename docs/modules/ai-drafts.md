# AI Draft / Proposal 模块

> 状态：设计稿 v0.1  
> 日期：2026-11-27  
> 范围：AI 生成内容的草稿 / 建议态承接、用户审核动作、应用到正式领域表的边界  
> 不包含：Prisma schema 实现、API 代码实现、UI 代码实现、复杂全局审核流、多级审批、AI 生成执行

---

## 1. 模块定位

`AI Draft / Proposal` 是 AI 小说工作台中承接模型输出的统一草稿层。

它解决的问题是：

```txt
AI 生成了内容
  -> 不能直接写入 confirmed / canon 正式数据
  -> 需要先进入可查看、可编辑、可丢弃、可反馈重生成的建议态
  -> 用户明确应用后，才写入 Character / Location / ScenePlan / ChapterVersion 等正式领域表
```

本模块的核心目标：

1. 保护正史数据：AI 输出默认不直接进入 confirmed/canon 正式数据。
2. 统一承接 AI 输出：角色、地点、场景计划、章节正文、关系、摘要、长期记忆等 AI 输出，都可以先保存为草稿。
3. 保持用户动作极简：应用、编辑、丢弃、带反馈重生成。
4. 保留生成追溯：每个草稿应能追溯来源任务、上一个草稿、用户反馈和最终应用目标。
5. 为 Context Builder / PromptRender / GenerationTask 留出清晰接点。
6. 避免创作 ERP 化：不把每种创作判断都固化为状态、按钮、字段或流程分支。

---

## 2. 不负责什么

AI Draft / Proposal 不负责：

1. 不调用 LLM。模型调用属于 `GenerationTask + LLM Provider`。
2. 不拼 Prompt。Prompt 渲染属于 `PromptRender / Prompts`。
3. 不构建上下文。上下文选择、压缩、快照属于 `Context Builder`。
4. 不替代正式领域表。`GeneratedDraft` 不是 Character、Location、ScenePlan、ChapterVersion、Relationship、MemoryRecord 的长期替代品。
5. 不做全局复杂审核系统。P1 不做跨模块全局待审核队列、多人审批、审核人、审核 SLA、复杂状态机。
6. 不定义所有创作判断枚举。“不够燃”“人物动机弱”“伏笔太直白”“文风不对”等应进入自然语言 feedback，而不是变成系统字段。
7. 不直接跨模块写数据库。Apply 时只能通过目标领域模块 Service / Use Case 写入正式表。
8. 不决定后续上下文读取策略。Context Builder 默认只读 confirmed 正式数据；draft 只有用户显式选择时才参与本次生成。

---

## 3. 核心概念

### 3.1 GeneratedDraft

`GeneratedDraft` 是系统内部可落库的统一草稿记录。

它表达：

```txt
某次 AI 生成任务
针对某个项目 / 某个目标对象 / 某类创作任务
产出了一份可被用户审核的候选内容
```

示例：

```txt
为 Project A 生成 3 个角色候选
为 Character X 生成人物补全建议
为 Chapter 5 生成章节正文版本
为 Scene 2 生成 ScenePlan
为两个人物生成 Relationship 建议
为 ChapterSummary 生成摘要候选
```

### 3.2 Proposal

`Proposal` 是产品语义上的“建议”。

P1 可以不单独建 `Proposal` 表，而将它作为 `GeneratedDraft` 的用户侧命名和 UI 表达：

```txt
GeneratedDraft = 数据模型 / 后端实体
Proposal = 用户看到的“AI 建议 / 草稿”
```

界面上可叫：

```txt
AI 建议
AI 草稿
待应用草稿
候选版本
```

### 3.3 Draft 与正式领域对象

`GeneratedDraft` 只保存 AI 候选内容。正式数据仍写入各领域表：

```txt
Character
Location
ScenePlan
SceneVersion
ChapterVersion
ChapterSummary
Relationship
MemoryRecord
...
```

Apply 之后，`GeneratedDraft` 记录：

```txt
appliedTargetType
appliedTargetId
status = applied
```

正式内容之后由目标领域模块管理。

---

## 4. 字段草案

> 这里只定义概念字段，不实现 schema。

### 4.1 基础字段

| 字段 | 含义 |
|---|---|
| `id` | 草稿 ID |
| `projectId` | 所属小说项目 |
| `targetType` | 草稿目标类型，例如 `character`、`location`、`scene_plan`、`chapter_version` |
| `targetId?` | 目标对象 ID。新建类草稿可为空，补全 / 改写类草稿通常有值 |
| `draftType` | 草稿用途类型，例如 `create`、`update`、`rewrite`、`continue`、`summarize`、`relationship_suggestion` |
| `payload` | 结构化候选内容。具体结构由目标领域模块解释 |
| `textPreview` | 列表和卡片展示用摘要文本 |
| `status` | 草稿状态：`pending`、`applied`、`discarded`、`superseded` |
| `sourceTaskId` | 来源 GenerationTask ID |
| `feedback?` | 用户最近一次反馈文本 |
| `previousDraftId?` | 上一个草稿 ID，用于反馈重生成链路 |
| `appliedTargetType?` | 应用后写入的正式目标类型 |
| `appliedTargetId?` | 应用后写入的正式目标 ID |
| `createdAt` | 创建时间 |
| `updatedAt` | 更新时间 |
| `appliedAt?` | 应用时间 |
| `discardedAt?` | 丢弃时间 |
| `supersededAt?` | 被新草稿替代时间 |

### 4.2 targetType 建议值

P1/P2 可逐步覆盖：

```txt
project_profile
character
character_state
location
faction
species
story_item
world_rule
scene_plan
scene_version
scene_summary
scene_handoff
chapter_plan
chapter_version
chapter_summary
relationship
memory_record
```

原则：

1. `targetType` 表示草稿最终要应用到哪个领域。
2. 不为每个细碎创作判断新增 `targetType`。
3. 新增 `targetType` 前，目标领域模块必须已有清晰 Apply 边界。

### 4.3 draftType 建议值

保持少量、稳定：

```txt
create
update
rewrite
continue
summarize
expand
merge
extract
```

不要新增类似：

```txt
make_more_funny
increase_tension
fix_motivation
make_dialogue_subtle
add_foreshadowing
```

这些应进入 `feedback`，由大模型处理，而不是变成系统枚举。

### 4.4 payload 原则

`payload` 是 AI 候选内容，不是长期领域模型替代品。

规则：

1. `payload` 可以是 JSON，但不能变成永久绕过正式 schema 的万能字段。
2. 每个 `targetType` 的 Apply 逻辑必须由目标领域模块解释和校验。
3. P1 可先支持少量目标类型的 payload 约定。
4. payload 中可以包含模型输出的结构化信息，但正式写入时必须转换为目标领域表字段。
5. 无法安全结构化的长文本，可放入 `content` / `body` / `summary`，但仍由目标模块决定如何保存。

---

## 5. 状态语义

状态必须少而清晰。

### 5.1 pending

草稿仍可被用户查看、编辑、应用、丢弃、带反馈重生成。

规则：

1. 新生成草稿默认是 `pending`。
2. `pending` 是唯一可操作状态。
3. 编辑草稿不改变状态。
4. 用户反馈重生成后，旧草稿可变为 `superseded`，新草稿为 `pending`。

### 5.2 applied

用户已经明确应用该草稿，内容已写入正式领域表。

规则：

1. `applied` 是终态。
2. 必须记录 `appliedTargetType` 和 `appliedTargetId`。
3. 已应用草稿不再允许编辑 payload。
4. 若正式对象后续被修改，不反向修改历史草稿。
5. Apply 是用户确认动作，不能由 AI 自动执行。

### 5.3 discarded

用户明确丢弃该草稿。

规则：

1. `discarded` 是终态。
2. 不物理删除草稿。
3. 丢弃不影响来源 GenerationTask。
4. 丢弃原因不必结构化，可选记录在 `feedback`。

### 5.4 superseded

该草稿已被反馈重生成的新草稿替代。

规则：

1. `superseded` 是终态。
2. 新草稿通过 `previousDraftId` 指向旧草稿。
3. 旧草稿仍可查看，用于追溯迭代过程。
4. P1 不做版本树 UI。

### 5.5 不建议增加的状态

P1 不建议增加：

```txt
reviewing
approved
rejected
needs_edit
needs_context
needs_prompt_fix
partially_applied
conflicted
merged
locked
```

这些会把模块推向复杂审核流和创作 ERP。必要信息用 `feedback`、目标模块校验错误或 GenerationTask 错误表达。

---

## 6. 用户动作语义

用户动作保持四个：

```txt
应用
编辑
丢弃
带反馈重生成
```

### 6.1 应用

用户确认该草稿可以进入正式领域。

语义：

```txt
把 pending GeneratedDraft 的 payload
交给目标领域模块
由目标领域模块校验、转换并写入正式表
然后将草稿标记为 applied
```

规则：

1. 只能对 `pending` 草稿应用。
2. Apply 必须是显式用户动作。
3. Apply 成功后记录 `appliedTargetType`、`appliedTargetId`、`appliedAt`。
4. Apply 失败时，草稿仍保持 `pending`，返回目标模块校验错误。
5. Apply 不等于直接覆盖。
6. 对正文类内容，Apply 应创建新版本，不直接覆盖当前正文。
7. 对正史类内容，Apply 是用户确认，可以写入 confirmed/canon；具体状态由目标领域模块决定。

### 6.2 编辑

用户在应用前修改 AI 草稿内容。

语义：

```txt
编辑 pending 草稿的 payload / textPreview
但不写入正式领域表
```

规则：

1. 编辑不改变草稿状态。
2. 只允许编辑 `pending` 草稿。
3. P1 不做复杂编辑历史。

### 6.3 丢弃

用户认为该草稿无用。

语义：

```txt
将 pending 草稿标记为 discarded
```

规则：

1. 只能丢弃 `pending` 草稿。
2. 不物理删除。
3. 不影响正式领域对象。
4. 不影响来源任务历史。

### 6.4 带反馈重生成

用户输入自然语言反馈，让 AI 基于当前草稿再生成一版。

语义：

```txt
保存用户 feedback
创建新的 GenerationTask
新任务产出新的 GeneratedDraft
旧草稿标记为 superseded
新草稿 previousDraftId 指向旧草稿
```

规则：

1. 反馈是自然语言，不拆成复杂枚举。
2. 旧草稿不被覆盖。
3. 新草稿仍是 `pending`。
4. 重生成过程属于 GenerationTask，不属于 Draft 模块直接调用模型。

---

## 7. Apply 如何写入正式领域表

AI Draft 模块只定义 Apply 边界，不实现各领域写入逻辑。

### 7.1 总原则

Apply 必须经过目标领域模块：

```txt
AI Draft Module
  -> target module apply use case
  -> target module service validation
  -> target domain table write
  -> return applied target id
  -> mark draft applied
```

禁止：

```txt
AI Draft Module 直接写 Character / Location / ScenePlan / ChapterVersion 表
```

### 7.2 事务边界

一次 Apply 应尽量在同一事务中完成：

```txt
1. 校验 draft.status = pending
2. 校验 draft.projectId 与目标对象 projectId 一致
3. 调用目标领域模块转换 payload
4. 写入正式领域表
5. 更新 GeneratedDraft.status = applied
6. 记录 appliedTargetType / appliedTargetId / appliedAt
```

如果目标写入失败：

```txt
GeneratedDraft 保持 pending
不写 appliedTargetId
返回错误给前端
```

### 7.3 各领域 Apply 边界

| 目标 | Apply 后写入 | 规则 |
|---|---|---|
| Character | `Character` / `CharacterState` | 关系建议不要塞进角色自由文本，应进入 Relationship |
| Location | `Location` / 地点子资源 | 跨实体连接走 Relationship |
| ScenePlan | `ScenePlan` | 不直接生成正文，不越权创建完整 Scene 树 |
| SceneVersion | 新 `SceneVersion` | 不覆盖当前正文；是否激活由用户动作或 Scene 模块决定 |
| ChapterVersion | 新 `ChapterVersion` | 不覆盖当前正文；可由用户选择是否更新 `Chapter.currentVersionId` |
| ChapterSummary | `ChapterSummary` | P1 不自动沉淀 MemoryRecord |
| Relationship | `Relationship` | Apply 前校验 source/target 同 project 且存在 |
| MemoryRecord | P2 再接入 | 从摘要到记忆必须有独立确认流程 |

---

## 8. 与其他模块的关系

### 8.1 与 Context Builder

```txt
GeneratedDraft 不默认进入 Context Builder
```

规则：

1. Context Builder 默认只读取 confirmed 正式数据。
2. `pending` 草稿不进入上下文。
3. 用户可显式选择某个草稿参与“本次生成上下文”。
4. 草稿被选入上下文，不代表它被确认。
5. ContextSnapshot 应记录本次包含了哪些 draft ID。

### 8.2 与 PromptRender

```txt
PromptRender 可引用当前生成任务使用的 draft 输入
GeneratedDraft 可引用产出它的 GenerationTask
```

规则：

1. PromptRender 不保存草稿生命周期状态。
2. PromptRender 记录当时渲染用的变量和上下文。
3. 用户基于草稿反馈重生成时，新的 GenerationTask 会产生新的 PromptRender。
4. Draft 模块不拼 Prompt，只向 GenerationTask 提供草稿 ID / feedback / target 信息。

### 8.3 与 GenerationTask

```txt
GenerationTask 负责生成
GeneratedDraft 负责承接生成结果
```

典型链路：

```txt
用户点击生成
  -> 创建 GenerationTask
  -> Context Builder 创建 ContextSnapshot
  -> PromptRender 渲染 Prompt
  -> LLM Provider 输出内容
  -> GenerationTask succeeded
  -> 创建 GeneratedDraft pending
  -> 用户审核
```

反馈重生成链路：

```txt
用户对 draft 输入 feedback
  -> 创建新的 GenerationTask
  -> task.input 引用 previousDraftId + feedback
  -> 新结果创建新的 GeneratedDraft
  -> 旧 draft 标记 superseded
```

规则：

1. Draft 不代表任务状态。
2. Task 失败不创建 pending draft。
3. Task 成功但输出无法解析时，不强行创建不可用草稿。
4. 一个 GenerationTask 可以产出一个或多个 GeneratedDraft；P1 可先限制一任务一草稿，P2 再扩展 batch。

### 8.4 与 Chapter Writing Workspace

章节写作工作台应优先展示“当前章节 / 当前场景相关”的草稿入口，而不是跳转到全局审核队列。

P1 推荐入口：

```txt
章节写作工作台
├── 当前 Scene 的 AI 草稿
├── 当前 Chapter 的 AI 草稿
├── 当前 ChapterSummary 的 AI 草稿
└── 当前 ChapterVersion 的 AI 草稿
```

规则：

1. P1 在模块内显示相关草稿。
2. 不做全局待审核中心。
3. 用户在当前章节上下文内完成应用、编辑、丢弃、反馈重生成。
4. 章节正文 AI 结果 Apply 后写入 ChapterVersion。
5. 场景正文 AI 结果 Apply 后写入 SceneVersion。
6. 摘要 AI 结果 Apply 后写入 ChapterSummary / SceneSummary。

---

## 9. P1 / P2 / P3

### 9.1 P1：模块内草稿闭环

目标：

```txt
让 AI 生成结果可以安全进入草稿态，并在模块内被用户审核应用。
```

范围：

1. `GeneratedDraft` 概念和最小生命周期。
2. 状态：`pending`、`applied`、`discarded`、`superseded`。
3. 用户动作：应用、编辑、丢弃、带反馈重生成。
4. 与 GenerationTask 建立来源关系。
5. 支持少量高价值目标类型：
   - `chapter_version`
   - `scene_version`
   - `scene_plan`
   - `chapter_summary`
   - 可选：`character`
6. Chapter Writing Workspace 内显示当前章节 / 场景相关草稿。
7. Apply 只接入少量目标领域模块。
8. 不做全局审核队列。
9. 不做复杂批量草稿。
10. 不做 MemoryRecord 自动沉淀。

P1 成功标准：

```txt
AI 生成章节 / 场景 / 摘要后，不再直接写正式表。
用户可以在工作台内查看草稿，并选择应用、编辑、丢弃或反馈重生成。
应用后正式领域表可追溯来源。
```

### 9.2 P2：多领域扩展与批量建议

目标：

```txt
让更多实体支持 AI 建议态，并支持一次生成多条候选。
```

范围：

1. 扩展目标类型：Character、Location、Faction、Species、WorldRule、Relationship。
2. 支持一个 GenerationTask 产出多个 GeneratedDraft。
3. 支持批量应用 / 批量丢弃，但保持交互简单。
4. Context Builder 支持用户显式选择 pending draft 参与本次生成。
5. Relationship 建议接入 Apply。
6. 从 ChapterSummary / SceneSummary 生成 MemoryRecord 候选，但不自动应用。
7. 草稿列表增加模块内筛选。

### 9.3 P3：全局待处理视图与高级追溯

目标：

```txt
在草稿数量变多后，提供更强的全局管理和追溯能力。
```

范围：

1. 全局 AI 草稿 / 建议队列。
2. 按项目、目标类型、来源任务、时间筛选。
3. 草稿迭代链查看。
4. 批量冲突检查。
5. Apply 前差异对比。
6. 更完整的审计记录。
7. 可能的 Review Inbox，但仍不是复杂审批 ERP。

P3 仍应避免：

```txt
多级审批流
角色权限矩阵
每种创作判断一个状态
把 AI 创作过程产品化成僵硬工单系统
```
