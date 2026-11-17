# 架构总览

## 目标

构建个人创作者使用的 AI 小说生成/创作工作台。

## 技术栈

- Frontend: React + TypeScript + Vite + Semi Design
- Backend: NestJS + TypeScript
- Database: PostgreSQL + Prisma
- Queue: Redis + BullMQ
- Streaming: SSE
- Context: Structured Context Builder first, pgvector reserved

## 分层

```txt
Frontend UI
  -> REST / SSE
Backend API
  -> Application Services
Domain Modules
  -> Infrastructure: Prisma / Redis / BullMQ / LLM Provider
```

## MVP 非目标

- 多人协作
- WebSocket 实时协同
- 完整向量 RAG
- 商业化计费
- 插件系统
