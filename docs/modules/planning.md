# Planning 模块

## 职责

管理小说从分卷到章节计划的规划层。

## 核心实体

- Volume
- ChapterPlan

## 长期方向

成熟形态可能包含：

```txt
Project
  -> Volume
  -> Arc
  -> Scene
  -> ChapterPlan
  -> Chapter
```

MVP 先实现 Volume 和 ChapterPlan，但保留后续 Arc/Scene 扩展空间。

## 规则

1. ChapterPlan 是生成前计划，不应混入 Chapter 正文版本。
2. ChapterPlan 可以绑定 Chapter，也可以先独立存在。
3. Context Builder 生成章节时应优先读取 ChapterPlan。
4. 不允许只用 Chapter.goal 替代完整规划层。
