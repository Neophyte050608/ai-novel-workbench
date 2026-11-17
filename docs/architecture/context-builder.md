# Context Builder

MVP 采用结构化上下文，不先做复杂向量 RAG。

## 输入

- projectId
- chapterId，可选
- generationType
- 用户选择的角色/世界观/约束，可选

## 输出

ContextSnapshot，包括：

- 项目简介
- 写作风格
- 当前章节目标
- 前文摘要
- 相关角色
- 相关世界观
- 禁止事项

## 后续演进

预留 `StructuredContextRetriever`、`VectorContextRetriever`、`HybridContextRetriever`。
