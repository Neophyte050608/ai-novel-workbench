# Database Migrations

这里记录重要数据库 migration 的背景、风险和验证方式。

## 模板

```md
# Migration 000X: 变更标题

## 背景

为什么需要这次变更？

## 变更内容

新增/修改/删除了哪些表、字段、索引、关系？

## 数据迁移策略

是否需要 backfill？是否影响已有数据？

## 回滚策略

如何安全回滚？

## 风险

- 

## 验证方式

- [ ] Prisma migrate 成功
- [ ] Prisma generate 成功
- [ ] 相关类型检查/测试通过
```
