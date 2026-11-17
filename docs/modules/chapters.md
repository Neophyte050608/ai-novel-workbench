# Chapters 模块

## 职责

管理章节元信息、章节正文版本和当前版本指针。

## 核心实体

- Chapter
- ChapterVersion
- ChapterSummary

## 规则

1. Chapter 是章节元信息，不直接作为唯一正文存储点。
2. 正文快照必须进入 ChapterVersion。
3. AI 生成结果必须先保存为 ChapterVersion，不得直接覆盖当前正文。
4. 用户确认后才激活为当前版本。
5. ChapterSummary 用于后续上下文和小说记忆，不应只是临时展示字段。

## 与生成链路关系

```txt
GenerationTask -> ChapterVersion -> ChapterSummary
```
