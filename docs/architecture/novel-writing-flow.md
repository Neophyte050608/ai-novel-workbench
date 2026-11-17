# AI 小说创作流程抽象

## 核心原则

本项目不是“Prompt -> 正文”的文本生成器，而是一个围绕小说项目记忆、上下文构建、Prompt 版本、生成任务、章节版本的创作系统。

我们采用：**完整边界，分阶段实现**。

功能可以一步一步做，但核心领域边界不能为了短期 MVP 被压扁。

## 主流程

```txt
Project
  -> Character / WorldItem
  -> Planning / ChapterPlan
  -> Chapter
  -> ContextSnapshot
  -> PromptVersion
  -> PromptRender
  -> GenerationTask
  -> LLMProvider
  -> SSE
  -> ChapterVersion
  -> ChapterSummary / Fact / CharacterState
```

## 模块分层

### 1. 创作资产层

- Projects
- Characters
- WorldItems
- Planning
- Chapters
- ChapterVersions

### 2. 小说记忆层

- ChapterSummaries
- Facts
- CharacterStates
- Relationships
- Foreshadowings，后置
- TimelineEvents，后置

### 3. 生成编排层

- GenerationTasks
- GenerationTaskAttempts
- GenerationEvents
- ContextBuilder
- ContextSnapshots
- PromptTemplates
- PromptVersions
- PromptRenders
- LLMProviders
- SSEStreaming

### 4. 后置增强层

- EntityGraph
- Assistant
- WorkflowEditor
- ExportArchive
- ConsistencyReview

## 不允许的轻实现

以下做法不允许：

1. 把章节计划只塞进 Chapter 的一个自由文本字段，导致后续无法独立演进 Planning。
2. 把角色当前状态只混在 Character.currentState 中，并完全不考虑 CharacterState 历史。
3. 把 Prompt 渲染结果不落库，只记录 PromptVersion。
4. 生成失败和重试只依赖 BullMQ 内存/Redis 状态，不落库 Attempt。
5. 把模型供应商只写在环境变量里，完全无法追溯某次生成使用的模型。
6. 把所有世界观、事实、伏笔混成一个 notes 字段。

## 允许的分阶段实现

允许：

1. 先有 LLMProvider 表和接口，但只实现 OpenAI-compatible。
2. 先有 CharacterState 表，但第一版只记录关键状态文本。
3. 先有 ChapterPlan 表，但第一版不做复杂 Arc/Scene。
4. 先有 PromptRender 表，但第一版只记录 renderedSystem/renderedUser。
5. 先有 GenerationTaskAttempt 表，但第一版只记录 attemptNo/status/error。
6. 先有 Fact 表，但第一版由用户手动确认或简单抽取。

## MVP 闭环

MVP 必须能完成：

```txt
创建项目
  -> 创建角色/世界观/章节计划
  -> 构建上下文
  -> 渲染 Prompt
  -> 流式生成章节
  -> 保存章节版本
  -> 记录摘要/事实/角色状态
```

这个闭环是地基。后续 RAG、审稿、伏笔、图谱、工作流编辑器都围绕它扩展。
