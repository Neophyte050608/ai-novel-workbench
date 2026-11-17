# Novel Memory 模块

## 职责

维护长篇小说的一致性记忆。

## 核心实体

- ChapterSummary
- Fact
- CharacterState
- Relationship
- KnowledgeChunk，后续 RAG 预留

## 作用

Novel Memory 解决：

- 前文发生过什么
- 哪些事实是正史
- 角色当前状态
- 角色/势力/物品之间的关系
- 哪些内容可进入后续上下文

## 规则

1. Fact 必须有 canonStatus。
2. CharacterState 必须可追溯来源。
3. ChapterSummary 是后续章节生成的重要输入。
4. Relationship 使用通用 source/target 模型，先支撑角色关系，后续支撑组织、地点、物品关系。
5. KnowledgeChunk 只做预留，不在 MVP 强依赖向量检索。
