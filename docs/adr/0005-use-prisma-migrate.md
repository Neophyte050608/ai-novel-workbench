# ADR-0005: 使用 Prisma Migrate 管理数据库迭代

## 状态

Accepted

## 背景

项目后端采用 NestJS + Prisma + PostgreSQL。用户过去习惯使用 Flyway，但当前阶段数据模型变化频繁，且 Prisma Client 类型生成依赖 `schema.prisma`。

如果同时引入 Flyway 和 Prisma Migrate，容易出现双 migration 源头：一边改 SQL，一边改 Prisma schema，AI 开发时尤其容易混乱。

## 决策

MVP 阶段统一使用 Prisma Migrate 管理业务 schema 变更。

- `apps/api/prisma/schema.prisma` 是业务数据模型主入口。
- 普通表、字段、关系、enum 变更通过 Prisma Migrate。
- Prisma 无法表达的高级 PostgreSQL 能力，可以在 Prisma migration 中补 raw SQL。
- 暂不引入 Flyway。

## 备选方案

1. Flyway 作为唯一迁移工具。
2. Prisma Migrate + Flyway 混合。
3. 纯 SQL migration。

## 取舍

优点：

- schema、migration、Prisma Client 类型生成保持一致。
- AI 开发约束更简单。
- 适合 MVP 阶段快速迭代。

缺点：

- 复杂 SQL 管理能力不如 Flyway 成熟。
- pgvector、特殊 index、trigger 等可能需要 raw SQL migration。

## 影响范围

- 数据库 schema
- Prisma Client
- 后端 Service 类型
- 数据库迁移文档
- AGENT.md 开发约束

## 后续行动

- [ ] 建立 `docs/database/migrations/` 说明目录。
- [ ] 后续真正启用 pgvector 时补充 raw SQL migration 规范。
- [ ] 如果数据库高级 SQL 明显增多，再重新评估是否引入 Flyway。
