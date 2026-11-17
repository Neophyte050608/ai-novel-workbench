# Migration 0002: expand-project-basic-fields

## 背景

创建小说前需要明确一部小说的基本属性，避免 Project 表过轻，后续接入 AI 新建小说时频繁迁移。

## 变更内容

Project 新增：

- subtitle
- status
- logline
- premise
- targetAudience
- targetLength
- language
- tone
- pov
- protagonist
- coverAssetId
- metadata

## 数据迁移策略

当前已有 Project 数据时：

- status 默认 planning
- language 默认 zh-CN
- 其他字段为空

## 回滚策略

开发阶段可重置 migration。生产阶段不直接删除字段，应先停用 UI 和写入逻辑。

## 验证方式

- [ ] Prisma migrate 成功
- [ ] Project CRUD 正常
- [ ] 新建小说可写入基础字段
- [ ] 首页书架可展示 title / genre / summary / writingStyle / status
