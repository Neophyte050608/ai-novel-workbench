# Context Builder 模块

## 职责

Context Builder 在 AI 生成前，把项目内结构化资料组装成一次性的 `ContextSnapshot`。

Context Builder 不是“写章节专用”的工具，而是所有 AI 创作任务的资料包层。它的长期职责是按 `purpose` 为不同 AI 任务构建不同上下文，例如：创建小说基础信息、生成角色、生成地点、生成势力、生成世界规则、生成分卷、生成章节计划、生成场景计划、写场景正文、写章节正文、总结摘要和抽取记忆。

P1 先实现正文链路中最靠近生成的两个 purpose：`generate_chapter` 和 `generate_scene`。其他 purpose 先在矩阵中定义读取策略，后续随 AI 功能逐个接入。

P1 的目标是：

1. **可预览**：`POST /projects/:projectId/context/preview` 返回本次上下文 `payload`、`sourceRefs`、目标信息和粗略 token 估算，不落库。
2. **可落库**：`POST /projects/:projectId/context/snapshots` 使用同一套构建规则保存 `ContextSnapshot`。
3. **可追溯**：`GET /projects/:projectId/context/snapshots` 和 `GET /projects/:projectId/context/snapshots/:snapshotId` 用于回看生成前依据了哪些资料。

## 不负责什么

P1 明确不负责：

- 不调用 LLM。
- 不渲染 Prompt。
- 不创建 `GenerationTask`。
- 不创建 SSE 或真实 AI 生成流程。
- 不做复杂 RAG、pgvector 或相似度检索。
- 不自动沉淀 `MemoryRecord`。
- 不维护全局草稿队列。
- 不把整段历史正文塞进上下文；优先使用摘要、计划和结构化资料。

## 输入参数

Context Builder P1 接受：

```ts
type BuildContextDto = {
  purpose:
    | 'generate_project_profile'
    | 'generate_characters'
    | 'generate_locations'
    | 'generate_factions'
    | 'generate_world_rules'
    | 'generate_volume'
    | 'generate_chapter_plan'
    | 'generate_scene_plan'
    | 'generate_chapter'
    | 'generate_scene'
    | 'summarize_chapter'
    | 'extract_memory';
  chapterId?: string;
  sceneId?: string;
  includeDrafts?: boolean;        // 默认 false
  selectedDraftIds?: string[];    // 默认 []
  previousChapterCount?: number;  // 默认 3，P1 上限 3
};
```

P1 代码实现 `generate_chapter` 和 `generate_scene`。其他 purpose 先作为设计矩阵中的策略边界，后续随对应 AI 功能逐个实现；未实现 purpose 必须返回清晰错误，不允许悄悄 fallback 到章节/场景上下文。


## Purpose Matrix / AI 任务上下文矩阵

Context Builder 应按 AI 任务 purpose 选择资料，不同任务不能共用一套“全量项目上下文”。下面矩阵用于指导后续扩展，P1 代码只实现 `generate_chapter` 与 `generate_scene`。

| purpose | 用途 | 主要输入 | 默认读取 | 默认不读取 | 输出目标 |
|---|---|---|---|---|---|
| `generate_project_profile` | 根据创意生成小说基础信息 | 用户创意、类型/标签、篇幅/风格偏好 | 用户输入、已有 Project 草稿、显式选择的 draft | 章节/场景正文、实体状态历史 | `GeneratedDraft project_profile` |
| `generate_characters` | 批量生成核心角色 | Project / story seed / user guidance | Project 基础设定、世界观摘要、已有 confirmed 角色/势力/规则/地点 | 章节全文、场景全文、未确认草稿 | `GeneratedDraft character[]` |
| `generate_locations` | 生成地点 | Project / worldview / volume? | 世界观、时代背景、confirmed 地点/势力/规则/物种 | 章节全文、无关正文版本 | `GeneratedDraft location[]` |
| `generate_factions` | 生成势力 | Project / mainPlot / conflict | 世界观、主线冲突、confirmed 角色/地点/规则/已有势力 | 全量章节正文 | `GeneratedDraft faction[]` |
| `generate_world_rules` | 生成世界规则 | premise / worldview / genre | Project 设定、confirmed 世界规则/物种/能力/道具 | 章节全文、未确认规则草稿 | `GeneratedDraft world_rule[]` |
| `generate_volume` | 生成分卷 / StoryUnit | Project / target volume count | Project 主线、confirmed assets、已有 Volume、前文摘要 | pending draft 默认不读 | `GeneratedDraft volume[]` |
| `generate_chapter_plan` | 生成章节计划 | Volume / Chapter / previous summaries | Project、Volume、上一章 confirmed ChapterSummary、相关角色/地点/势力/规则 | 历史正文全文 | `GeneratedDraft chapter_plan` |
| `generate_scene_plan` | 生成场景计划 | ChapterPlan / Chapter / scene count | ChapterPlan、Chapter 目标、前文摘要、相关资产 | 全量章节正文 | `GeneratedDraft scene_plan[]` |
| `generate_scene` | 写场景正文 | Scene / ScenePlan | Project、Chapter、ChapterPlan、Scene、ScenePlan、前序 SceneSummary/Handoff、相关角色/地点 | 未确认 draft、无关全文 | `GeneratedDraft scene_version` |
| `generate_chapter` | 写章节正文 | Chapter / Scenes | Project、Volume、ChapterPlan、Scenes、ScenePlan、confirmed SceneSummary/Handoff、前 1-3 章摘要 | 全历史正文、未确认草稿 | `GeneratedDraft chapter_version` |
| `summarize_chapter` | 生成章节摘要 | ChapterVersion / SceneSummary | 当前 ChapterVersion、SceneSummary、ChapterPlan、SceneHandoff | 无关资产全集 | `GeneratedDraft chapter_summary` |
| `extract_memory` | 抽取长期记忆候选 | confirmed ChapterSummary/SceneSummary | confirmed 摘要、sourceRefs、相关实体 | 未确认摘要、正文全文默认不读 | `GeneratedDraft memory_record` |

设计原则：

1. 每个 purpose 都必须声明“读取什么”和“不读取什么”。
2. 生成基础资产类 purpose 更依赖 Project/World/已确认资产，不应读取章节正文全文。
3. 写正文类 purpose 更依赖计划、前文摘要、handoff 和相关实体，不应读取全量项目。
4. 摘要/记忆类 purpose 更依赖已产出的正文版本和摘要，不应反向读取未确认草稿。
5. pending draft 只有用户显式选择才进入上下文。
6. 后续新增 purpose 必须先补矩阵，再实现读取策略和测试。

## P1 读取范围

### 通用规则

- 所有读取都限定在当前 `projectId` 内。
- 不读取 `deletedAt != null` 的数据。
- 不读取 `canonStatus = archived` 的业务资料。
- 默认 **confirmed first**：能取 confirmed 时优先使用 confirmed；没有 confirmed 的当前计划类资料可退回最新非删除记录，避免当前章节或场景完全无上下文。
- pending `GeneratedDraft` 默认不进入上下文。
- pending draft 只有在 `selectedDraftIds` 指定，或 `includeDrafts: true` 明确开启时，才进入 `payload.selectedDrafts` 和 `sourceRefs`。
- `selectedDraftIds` 只接受当前项目内、`status = pending`、未删除的草稿。

### generate_chapter

`generate_chapter` 必须提供 `chapterId`。上下文包含：

- Project 基础信息：标题、logline、premise、coreIdea、mainPlot、summary、worldview、writingStyle、tone、pov、目标篇幅等。
- 当前 Chapter 所属 Volume（如存在）。
- 当前 Chapter 元信息。
- 当前 Chapter 的 ChapterPlan：优先 confirmed/latest。
- 前 1-3 章 confirmed `ChapterSummary`。
- 当前章 confirmed `ChapterSummary`（如有）。
- 当前章下 Scene 列表。
- 每个 Scene 的 current/confirmed `ScenePlan`、confirmed `SceneSummary`、confirmed `SceneHandoff`。
- confirmed 项目级基础资产：角色、地点、势力、物种、世界规则、世界条目、道具、能力；P1 按 importance/创建时间取有限数量，不做复杂检索。
- 显式纳入的 pending drafts。

### generate_scene

`generate_scene` 必须提供 `sceneId`。上下文包含：

- Project 基础信息。
- 当前 Chapter 元信息。
- 当前 ChapterPlan：优先 confirmed/latest。
- 当前 Scene 元信息。
- 当前 Scene 的 current/confirmed `ScenePlan`。
- 当前 Scene 前序场景的 confirmed `SceneSummary` 和 `SceneHandoff`。
- 上一条 handoff（`previousHandoff`），方便续写衔接。
- 相关角色/地点：至少读取 `Scene.povCharacterId` 和 `Scene.primaryLocationId` 指向的 confirmed 资料。
- confirmed 项目级 top assets。
- 显式纳入的 pending drafts。

## sourceRefs

凡进入上下文的重要对象，都写入 `sourceRefs`，例如：

```json
{ "type": "chapter", "id": "..." }
{ "type": "chapter_plan", "id": "..." }
{ "type": "scene_summary", "id": "..." }
{ "type": "character", "id": "..." }
{ "type": "generated_draft", "id": "..." }
```

`sourceRefs` 是后续 PromptRender 和 GenerationTask 追溯的依据。P1 只记录引用，不解析成 Prompt，也不创建生成任务。

## ContextSnapshot schema

P1 快照保存：

- `projectId`
- `purpose`
- `targetType` / `targetId`
- `chapterId`
- `sceneId`
- `payload`
- `sourceRefs`
- `tokenEstimate`
- `metadata`
- `builderVersion`
- `createdAt` / `updatedAt`

`metadata` P1 记录构建参数和统计信息：`includeDrafts`、`selectedDraftIds`、`previousChapterCount`、`sourceRefCount`。

## 与 AI Draft / PromptRender / GenerationTask 的关系

- **AI Draft**：Context Builder 可以显式读取 selected pending drafts，但不会创建、应用、丢弃或重生成 draft。
- **PromptRender**：Context Builder 只产出结构化 `payload`，不渲染 Prompt。PromptRender 后续应引用 `ContextSnapshot` 并记录渲染后的最终模型输入。
- **GenerationTask**：P1 不创建 GenerationTask。后续生成流程应先保存 ContextSnapshot，再把 `contextSnapshotId` 绑定到 GenerationTask。
