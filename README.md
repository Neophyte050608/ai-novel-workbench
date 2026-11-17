# AI Novel Workbench

AI 小说生成/创作工作台。

## 技术栈

- Frontend: React + TypeScript + Vite + Semi Design
- Backend: NestJS + TypeScript
- Database: PostgreSQL + Prisma，预留 pgvector
- Queue: Redis + BullMQ
- Streaming: SSE
- Context: Structured Context Builder first

## 本地启动

> 当前仓库只包含骨架文件，尚未安装依赖。

```bash
pnpm install
docker compose up -d
pnpm db:generate
pnpm db:migrate
pnpm dev
```

## 目录

```txt
apps/web   前端应用
apps/api   后端服务
packages   共享类型与 Prompt 规范
docs       架构与维护文档
AGENT.md   AI 开发约束
```

## 开发原则

先读 `AGENT.md`，再改代码。
核心原则：生成任务落库、Prompt 版本化、章节版本化、Context Builder 独立、LLM 调用统一走 Provider Adapter。


## 本地端口

为避免和本机已有服务冲突，Docker Compose 当前使用：

- PostgreSQL: `localhost:55432 -> container:5432`
- Redis: `localhost:6380 -> container:6379`

连接串见 `.env.example`。
