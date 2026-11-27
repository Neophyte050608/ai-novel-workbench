# Context Builder 模块

## 职责

Context Builder 在 AI 生成前，把项目内结构化资料组装成一次性的 `ContextSnapshot`。

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
  purpose: 'generate_chapter' | 'generate_scene' | 'continue_chapter' | 'summarize_chapter';
  chapterId?: string;
  sceneId?: string;
  includeDrafts?: boolean;        // 默认 false
  selectedDraftIds?: string[];    // 默认 []
  previousChapterCount?: number;  // 默认 3，P1 上限 3
};
```

P1 实现 `generate_chapter` 和 `generate_scene`。其他 purpose 保留为后续扩展，不在 P1 生成上下文。

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
