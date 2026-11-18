# 基于开源 AI 小说项目调研的路线规划

> 本路线基于 `docs/research/open-source-ai-novel-projects.md`，结合当前项目已有实体和实现状态制定。

## 当前原则

1. 不继续盲目扩展设定实体。
2. 先跑通当前已有基础实体链路。
3. 后续优先补长篇生成的结构层、记忆层、上下文注入层和连续性检查。
4. 任何新模块先写模块文档，再 schema/migration，再 API，再 UI。
5. 未接入 AI 生成前，不展示可执行 AI 按钮。

---

## 阶段 0：当前实体地基收尾

目标：确认当前已做实体可以稳定人工录入和读取。

任务：

- `ENTITY-QA-1`：已有实体 API 冒烟测试。
- `ENTITY-QA-2`：前端工作台人工录入冒烟。
- `ENTITY-DOC-1`：实体实现状态文档同步。
- `ENTITY-COMMIT-1`：阶段提交并推送。

验收：

```txt
Project / Character / Location / Faction / Species / WorldRule
均可 list/create/update/delete/profile 或等价基础链路跑通。
```

---

## 阶段 1：Scene 粒度与章节生成结构

目标：把“整章生成”拆到 Scene 粒度，支持更稳定的长篇生成。

建议实体：

```txt
Scene
ScenePlan
SceneVersion
SceneSummary
SceneHandoff
```

关键设计点：

- Scene 属于 Chapter。
- ScenePlan 是写作计划，不混正文。
- SceneVersion 存正文片段版本。
- SceneHandoff 记录 readerKnows、actualChanges、openQuestions、nextSceneMust。

验收：

```txt
ChapterPlan 可以拆出 ScenePlan。
Scene 可生成/编辑版本。
Scene 完成后可产出 summary/handoff。
```

---

## 阶段 2：剧情线、伏笔与开放问题

目标：让长篇故事可以追踪支线、伏笔、承诺和回收。

建议实体：

```txt
PlotThread
PlotEvent
Foreshadowing
OpenQuestion
```

关键设计点：

- PlotThread 表示一条剧情线。
- PlotEvent 记录 setup / escalation / reveal / payoff / resolution。
- Foreshadowing 可作为 PlotThread 的特化或独立表。
- OpenQuestion 用于读者/剧情尚未解答的问题。

验收：

```txt
可以记录一个伏笔从埋下到回收的章节/场景链路。
```

---

## 阶段 3：记忆与证据化事实

目标：将章节/场景产生的事实沉淀为可追溯记忆。

建议实体：

```txt
MemoryRecord
EvidenceRef
```

也可以增强现有 `Fact`。

关键设计点：

- 记忆必须能引用来源：chapterVersion / sceneVersion / paragraph / quote。
- 记忆有 confidence、canonStatus、importance。
- 记忆能关联 Character / Location / Faction / Species / WorldRule / StoryItem。

验收：

```txt
可以从某段正文抽取事实，并追溯到原文证据。
```

---

## 阶段 4：LoreEntry 与 Context 注入策略

目标：不要把结构化实体直接粗暴塞进 prompt，而是建立可控上下文注入层。

建议实体：

```txt
LoreEntry
ContextSourceItem
```

关键设计点：

- LoreEntry 是 prompt 注入单元，不等同于 Character/Location 等实体。
- 支持 keys、aliases、activationMode、insertionPosition、insertionOrder、tokenBudget。
- ContextSourceItem 记录每次 Context Builder 选择了什么、为什么选、占多少 token。

验收：

```txt
ContextSnapshot 不只是 Json sourceRefs，而能审计上下文来源和原因。
```

---

## 阶段 5：连续性检查与审稿闭环

目标：生成后能发现并管理矛盾，而不是只把文本保存下来。

建议实体：

```txt
ContinuityIssue
ReviewResult
```

关键设计点：

- issueType：contradiction / missing_setup / timeline_error / character_ooc / world_rule_violation。
- severity：low / medium / high / blocking。
- status：open / fixed / ignored。
- 支持 suggestedFix 和 evidence。

验收：

```txt
生成章节/场景后，可以产出连续性问题并追踪处理状态。
```

---

## 阶段 6：时间线与故事时间

目标：让事件、状态变化和章节/场景有 story time。

建议实体：

```txt
TimelineEvent
EntityOccurrence
```

关键设计点：

- TimelineEvent 有 storyTime、orderIndex、chapterId、sceneId。
- EntityOccurrence 记录某实体在事件中的角色。

验收：

```txt
可以按故事时间查看人物/地点/势力/物品的重要事件。
```

---

## 阶段 7：剧情道具与物品状态

目标：补齐 StoryItem，并支持归属、状态、规则。

建议实体：

```txt
StoryItem
StoryItemState
StoryItemRule
```

关键设计点：

- StoryItem 是剧情物品，不是 WorldItem。
- 归属/持有可通过 Relationship 或后续 Ownership 表。
- 物品规则通过 StoryItemRule 关联 WorldRule。

验收：

```txt
可以记录关键道具的能力、限制、当前状态和持有变化。
```

---

## 阶段 8：AgentProfile 与生成角色分工

目标：区分 writer / planner / editor / reviewer / extractor 等生成角色。

建议实体：

```txt
AgentProfile
```

关键设计点：

- 绑定 LLMProvider、model、temperature、PromptTemplate。
- GenerationTask 可记录使用的 AgentProfile。

验收：

```txt
章节生成、摘要、审稿、事实抽取可以使用不同 agent 配置。
```
