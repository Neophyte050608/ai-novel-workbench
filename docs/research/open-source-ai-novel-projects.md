# 开源 AI 小说 / 长文创作项目调研

> 本文记录 2026-11-18 前后针对开源 AI 小说、长文创作、交互叙事和 AI 写作工作台项目的阶段性调研结果。目标不是全网穷尽，而是沉淀后续产品和实体设计可复用的参考。

## 调研结论摘要

当前较成熟的 AI 小说 / 长文创作项目，通常不是简单的 `Project -> Chapter -> Text`，而是分成五层：

1. **作品结构层**：Project / Book / Volume / Act / Chapter / Scene / Beat / StoryMapNode。
2. **设定资料层**：Character / Location / Faction / Item / Species / Lore / WorldRule。
3. **时序状态层**：CharacterState / LocationState / WorldState / Inventory / StoryTime / TimelineEvent。
4. **记忆与上下文层**：MemoryRecord / Fact / Summary / EmbeddingChunk / ContextSnapshot / LoreEntry。
5. **生成流程层**：Plan / PromptTemplate / AgentProfile / GenerationTask / Review / Version / ContinuityIssue。

本项目目前在“设定资料层”已经比较强，尤其是：

- Character / CharacterState / CharacterIdentity
- Location / LocationState / LocationRule / LocationFaction
- Faction / FactionState / FactionMembership / FactionRelation / FactionRule
- Species / SpeciesTrait / SpeciesAbility / SpeciesRule
- WorldRule

主要缺口集中在：

- Scene / Beat 级结构
- PlotThread / Foreshadowing / OpenQuestion
- MemoryRecord + EvidenceRef
- LoreEntry / Context Injection
- ContinuityIssue / ReviewResult
- TimelineEvent / StoryTime
- StoryMapNode / 可视化大纲节点

---

## 1. AI 小说 / 长篇故事生成工具

### gpt-author

- 链接：https://github.com/mshumer/gpt-author
- 类型：早期热门整本小说生成 Notebook。
- 开源状态：MIT。
- 技术线索：Jupyter Notebook / Python / OpenAI / Anthropic / Stable Diffusion / ebooklib。
- 核心流程：

```txt
Prompt
  -> potential plots
  -> selected plot
  -> improved plot
  -> title
  -> storyline
  -> chapter list
  -> chapter prose
  -> cover prompt
  -> EPUB
```

启发：即使简单生成器，也区分 plot、storyline、chapter prose、export。

### GPTAuthor

- 链接：https://github.com/dylanhogg/gptauthor
- 类型：CLI 长篇多章节故事生成器。
- 开源状态：MIT。
- 技术线索：Python CLI / Poetry / OpenAI。
- 核心流程：

```txt
Story prompt
  -> AI synopsis
  -> chapter summaries
  -> human review
  -> iterative chapter generation
  -> Markdown / HTML output
```

启发：生成章节前的人类 synopsis review 是重要 checkpoint。

### StoryCraftr

- 链接：https://github.com/raestrada/storycraftr
- 官网：https://storycraftr.app
- 类型：AI 图书创作 CLI，强调 worldbuilding、outline、chapters、chat。
- 开源状态：MIT。
- 技术线索：Python CLI / LangChain / OpenAI / OpenRouter / Ollama / local embeddings。
- 核心概念：

```txt
BookProject
  config
  outline
  worldbuilding
  chapters
  chatSession
  iterationCommands
```

启发：`Project.behavior` / 写作规范、`iterate` 章节插入和结构变动值得参考。

### NovelGenerator

- 链接：https://github.com/KazKozDev/NovelGenerator
- 类型：本地 AI 小说生成器，强调因果规划、持久故事记忆、scene handoff、continuity checks。
- 开源状态：BUSL 1.1，source-available，非 OSI 开源。
- 技术线索：TypeScript / Vite / IndexedDB / Gemini / Ollama。
- 核心流程：

```txt
premise
  -> design
  -> plan review
  -> chapter plan
  -> scene
  -> handoff
  -> rebase
  -> next scene
  -> audit
  -> export
```

关键实体/概念：

```txt
BookRun / Project
  premise
  construction
    cast
    worldRules
    causalMap
    ending
    chapterMap
  chapters
    chapterPlan
    scenes
      scenePlan
      prose
      memoryExtraction
      handoff
      continuityReview
  storyMemory
    event
    locationChange
    knowledgeChange
    promiseOpenedClosed
    citation
  audit
  export
```

启发：

- Scene 和 SceneHandoff 很重要。
- MemoryRecord 最好带 source paragraph citation。
- ContinuityIssue 可独立建模。
- Writer / Editor / Reviewer 可作为 AgentProfile。

---

## 2. 长文生成 / 记忆 / 上下文框架

### LongWriter

- 链接：https://github.com/THUDM/LongWriter
- 类型：研究型长文生成项目。
- 开源状态：Apache-2.0。
- 技术线索：Python / Transformers / vLLM / GLM / Llama。
- 启发：偏模型能力与数据集，不是写作工作台；但说明长文输出需要专门数据、评估和长上下文策略。

### LangChain / LangGraph

- LangChain：https://github.com/langchain-ai/langchain
- LangGraph：https://docs.langchain.com/oss/python/langgraph/overview
- 类型：通用 Agent / RAG / 工具编排框架。
- 开源状态：MIT。
- 核心概念：

```txt
StateGraph
Node
Edge
Checkpoint
Memory
Tool
Agent state
Human-in-the-loop interrupt
```

启发：长篇生成流程天然适合 graph/checkpoint，而不是单个 generation task。

### LlamaIndex

- 链接：https://github.com/run-llama/llama_index
- 文档：https://docs.llamaindex.ai/
- 类型：文档处理 / RAG 框架。
- 开源状态：MIT。
- 核心概念：

```txt
Document
  -> Node / Chunk
  -> Embedding
  -> Index
  -> Retriever
  -> QueryEngine / Agent
```

启发：小说设定、章节、摘要应该有结构化切块和检索记录。

### Chroma

- 链接：https://github.com/chroma-core/chroma
- 类型：向量检索 / AI search infrastructure。
- 开源状态：Apache-2.0。
- 启发：可作为 KnowledgeChunk / Embedding / Collection / QueryResult 的后端参考。

### mem0

- 链接：https://github.com/mem0ai/mem0
- 文档：https://docs.mem0.ai/overview
- 类型：AI agent memory layer。
- 开源许可：本次未稳定核验，后续需二次确认。
- 启发：Memory 不只是向量块，而是 user/session/agent scoped memories，小说可映射为 Project/Character/Story scoped memory。

---

## 3. 角色 / 世界观 / Lore 管理工具

### SillyTavern

- 链接：https://github.com/SillyTavern/SillyTavern
- 文档：https://docs.sillytavern.app/
- 类型：AI 角色聊天 / 角色扮演前端。
- 开源状态：AGPL-3.0。
- 技术线索：JavaScript / Node / Web UI。
- 角色卡概念：

```txt
Character
  name
  description
  personality
  scenario
  firstMessage
  alternateGreetings
  exampleMessages
  creatorMetadata
  tags
  promptOverrides
  characterNote
  characterBook / embeddedLorebook
```

启发：角色不只是资料，也是 prompt 构建的一部分。

### SillyTavern World Info / Lorebook

- 文档：https://docs.sillytavern.app/usage/core-concepts/worldinfo/
- 类型：动态 lore 注入系统。
- 核心概念：

```txt
Lorebook / WorldInfo
  scope: global | character | persona | chat
  entries
    title / memo
    keys
    secondaryKeys
    selectiveLogic
    content
    insertionOrder
    insertionPosition
    probability
    enabled
    inclusionGroup
    groupWeight
    characterFilter
    triggerTypes
    recursion / embedding strategy
```

启发：Lore 不是静态百科，而是带触发规则的上下文片段。对本项目后续 Context Builder 很关键。

### lorebook-creator

- 链接：https://github.com/virgilianshailer/lorebook-creator
- 类型：构建、修复、合并 SillyTavern World Info / Lorebook 的工具。
- 开源状态：MIT。
- 启发：Lorebook 可以有 guided worldbuilding form、merge、repair、import。

### Writers-Workbench

- 链接：https://github.com/deiomo/Writers-Workbench
- 类型：SillyTavern / AI roleplay 角色卡构建器。
- 开源状态：MIT。
- 启发：角色卡编辑器、Live tab、card metadata 可参考。

### NovelAI Lorebook

- 文档：https://docs.novelai.net/en/text/lorebook/
- 状态：商业闭源产品，仅作为概念参考。
- 启发：characters、locations、objects、concepts 通过触发和上下文注入补充模型记忆。

---

## 4. 交互小说 / AI Text Adventure

### Aventuras

- 链接：https://github.com/AventurasTeam/Aventuras
- 官网：https://aventura.camp
- 类型：LLM 交互小说 / text adventure 前端，支持 Adventure 和 Creative Writing。
- 开源状态：AGPL-3.0。
- 技术线索：TypeScript / SvelteKit / Tauri / SQLite / Vercel AI SDK / LiquidJS / CodeMirror / Zod。
- 核心概念：

```txt
Story
  mode: Adventure | CreativeWriting
  chapters
    summary
    turns/scenes
  lorebook
    entries
      type: character | location | item | faction | concept | event
      aliases
      secrets
      keywords
      relevance
      storyTime
  worldState
    presentCharacters
    currentLocation
    inventory
    facts
  vault
    reusableCharacters
    reusableLorebooks
    scenarios
  promptPack
  agentProfiles
```

启发：

- StoryTime / TimelineEvent 很重要。
- Inventory / ItemOwnership 对交互和剧情道具重要。
- Vault / 模板库可以作为后续复用设计。
- Prompt packs / Agent profiles 值得参考。

### interactive_fiction_game

- 链接：https://github.com/dzyamik/interactive_fiction_game
- 类型：LangChain + LangGraph + OpenAI 的文本冒险示例。
- 开源许可：未见明确 license，需二次确认。
- 启发：State memory、multi-agent flow、dynamic story generation。

### GAIME

- 链接：https://github.com/hazelcreek/gaime
- 文档：https://hazelcreek.github.io/gaime/project-readme/
- 类型：AI text adventure engine prototype。
- 开源许可：未见明确 license，需二次确认。
- 启发：Game state consistency、classic text gameplay + AI response。

### TALES / tale-suite

- 链接：https://github.com/microsoft/tale-suite
- 官网：https://microsoft.github.io/tale-suite/
- 类型：Text Adventure Learning Environment Suite，偏 benchmark/evaluation。
- 开源状态：MIT。
- 启发：Environment / Game / State / Action / Score，可用于交互叙事评估。

---

## 5. 通用 AI 写作平台

### OpenWrite

- 链接：https://github.com/ilrein/openwrite
- 官网：https://ilrein.github.io/openwrite/
- 类型：开源 AI 写作平台，面向 novelists、screenwriters、creative writers。
- 开源状态：AGPL-3.0。
- 技术线索：React 19 / TanStack Router / Tailwind/shadcn / Hono / Cloudflare Workers / D1 SQLite / Drizzle / Better Auth / Bun。
- 核心概念：

```txt
Workspace
  Projects
    type: novel | trilogy | series | short_story_collection | screenplay
    genre
    status
    targetWordCount
    manuscript
      chapters
    storyMap
      nodes
        type: premise | act | chapter | scene
        parent / edges
        generatedText
        promotedToChapter
    codex
      characters
      locations
      loreEntries
      plotPoints
    assistantContext
```

启发：

- StoryMapNode / Act / Scene canvas 很值得参考。
- PlotPoint 可以独立于 ChapterPlan。
- Promote node to manuscript 是很好的工作流概念。

### Dify / Flowise / AnythingLLM / Open WebUI

这些是通用 LLM app / workflow / RAG / chat 平台，不是小说原生项目。可参考：

- Workflow / Node / Edge / Tool / Dataset
- Knowledge base / RAG / Chat session
- Agent / Tool / Prompt orchestration

但它们缺小说专属实体，不宜直接照搬。

---

## 6. 实体设计模式归纳

### 模式 1：结构层与正文层分离

```txt
Project / Book
  Outline / StoryMap
    Act
    ChapterPlan
    ScenePlan
    Beat
  Manuscript
    Chapter
    Scene
    Version
```

计划是意图，正文是结果。二者不应混用。

### 模式 2：Codex / Lorebook 双形态

```txt
Structured Entity:
  Character / Location / Faction / Item

Prompt Injection Entry:
  LoreEntry
    keys
    aliases
    content
    order
    position
    scope
    probability
```

结构化实体用于编辑和关系；LoreEntry 用于 prompt 注入。

### 模式 3：基础设定 + 时序状态

```txt
Character
  base profile
  states
    chapterId / sceneId / storyTime
    location
    goal
    emotionalState
    knownSecrets
```

本项目已经有 CharacterState、LocationState、FactionState。

### 模式 4：原子记忆带证据

```txt
MemoryRecord
  type
  content
  entities
  sourceChapterId
  sourceSceneId
  sourceVersionId
  quote / paragraphRef
  confidence
  canonStatus
  importance
```

记忆最好能追溯到原文片段，而不是只有一句摘要。

### 模式 5：Scene handoff / 因果传递

```txt
SceneHandoff
  readerKnows
  actualChanges
  openQuestions
  promisesOpened
  promisesClosed
  nextSceneMust
  contradictionWarnings
```

这对长篇连续性很关键。

### 模式 6：上下文构建可审计

```txt
ContextSnapshot
  purpose
  tokenBudget
  includedItems
    sourceType
    sourceId
    reason
    score
    tokenCount
```

本项目已有 ContextSnapshot，但 sourceRefs 仍是 Json，后续可结构化。

### 模式 7：生成流程角色分工

```txt
AgentProfile
  role: writer | planner | editor | reviewer | summarizer | retriever | extractor
  providerId
  model
  temperature
  promptTemplateId
```

本项目已有 LLMProvider，但还没有 AgentProfile。

### 模式 8：交互叙事需要 GameState

```txt
AdventureSession
  currentLocation
  presentCharacters
  inventory
  flags
  actionLog
  choices
  turnState
```

如果短期只做线性小说，可后置。

---

## 7. 对本项目的缺口建议

### P0 / P1：长篇生成核心

建议优先补：

```txt
Scene
ScenePlan
SceneVersion
MemoryRecord 或增强 Fact
ContinuityIssue
```

目标链路：

```txt
ChapterPlan
  -> ScenePlan
  -> Generate Scene
  -> Extract Memory
  -> Continuity Check
  -> Chapter Summary
```

### P1：剧情组织

建议补：

```txt
PlotThread
PlotEvent
Foreshadowing / OpenQuestion
```

用于追踪伏笔、支线、承诺、回收。

### P1：上下文注入

建议补：

```txt
LoreEntry
ContextSourceItem
```

不要只靠结构化实体直接塞 prompt。

### P1 / P2：时间线

建议补：

```txt
TimelineEvent
StoryTime
EntityOccurrence
```

### P2：剧情道具 / 物品状态

建议补：

```txt
StoryItem
StoryItemState
Ownership / Inventory
```

### P2：AgentProfile

建议补：

```txt
AgentProfile
```

区分 writer / planner / editor / reviewer / extractor 等生成角色。

---

## 8. 本项目当前判断

本项目目前的优势：

- 世界观结构化程度高。
- Character / Location / Faction / Species / WorldRule 已经比多数简单开源项目更细。
- Project / Chapter / ChapterVersion / ChapterPlan / Prompt / GenerationTask / ContextSnapshot 已有基础。

主要缺口：

- Scene 粒度。
- 伏笔 / 剧情线 / 开放问题。
- 证据化记忆。
- Lorebook 式上下文注入。
- 连续性检查。
- 时间线。

后续不建议继续无限扩展设定实体。应优先补“长篇生成所需的结构和流程”。
