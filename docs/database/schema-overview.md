# 数据库 Schema 总览

## Project domain

- Project：小说项目顶层资源。
- Volume：分卷。
- ChapterPlan：章节生成前计划。

原则：项目内资源必须带 projectId，规划层不混入正文版本。

## Writing domain

- Chapter：章节元信息。
- ChapterVersion：章节正文快照。
- ChapterSummary：章节摘要和关键事件。

原则：AI 生成结果必须保存为 ChapterVersion，不得直接覆盖正文。

## Asset domain

- Character：角色档案。
- WorldItem：世界观统一实体，覆盖地点、组织、规则、物品、历史等。
- Relationship：角色/组织/地点/物品之间的关系基础。

原则：MVP 使用统一 WorldItem，但保留 canonStatus 和关系模型。

## Memory domain

- Fact：正史事实台账。
- CharacterState：角色状态历史。
- KnowledgeChunk：后续 RAG/pgvector 预留。

原则：轻 RAG 先依赖结构化记忆，向量检索后置。

## Prompt domain

- PromptTemplate：Prompt 模板。
- PromptVersion：Prompt 版本。
- PromptRender：某次生成的最终渲染 Prompt。

原则：Prompt 是产品资产，必须版本化和可追溯。

## Generation domain

- GenerationTask：生成任务。
- GenerationTaskAttempt：生成尝试/重试记录。
- GenerationEvent：生成事件日志。
- ContextSnapshot：本次生成使用的上下文快照。

原则：生成任务必须落库，SSE 不承担业务状态。

## Provider domain

- LLMProvider：模型供应商非敏感配置。

原则：业务代码不直接依赖具体模型 SDK，生成任务记录 provider/model/参数/tokenUsage。
