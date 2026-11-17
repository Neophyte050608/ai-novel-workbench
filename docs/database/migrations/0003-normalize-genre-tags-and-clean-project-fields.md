# Migration 0003: normalize-genre-tags-and-clean-project-fields

## 背景

类型/题材和标签不应长期作为自由文本保存在 Project 上。否则会出现“玄幻 / 东方玄幻 / 东方式玄幻”等不可控值，影响筛选、Prompt 构建和后续推荐。

同时 `targetAudience` 暂不作为本地创作工具的核心字段，避免过早引入运营化属性。

## 变更内容

新增：

- Genre
- Tag
- ProjectGenre
- ProjectTag

Project 删除/清理：

- genre
- targetAudience

Project 新增创作档案字段：

- coreIdea
- mainPlot
- intro
- storySeed
- worldview
- eraBackground
- estimatedChapters
- wordsPerChapter

## 数据迁移策略

本地开发项目，不考虑历史兼容。

如果已有测试数据，允许丢弃或手动重建。

## 回滚策略

开发阶段可 reset 数据库。生产阶段暂不适用。

## 验证方式

- [ ] Prisma migrate 成功
- [ ] Genre / Tag 可 seed
- [ ] Project CRUD 正常
- [ ] 前端不再依赖 Project.genre
