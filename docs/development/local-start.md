# 本地一键启动

## 一键启动

```bash
pnpm start:dev
```

这个脚本会：

1. 检查 pnpm / Docker / curl / lsof。
2. 自动创建 `.env` 和 `apps/api/.env`，如果它们不存在。
3. 如未安装依赖，执行 `pnpm install`。
4. 启动 PostgreSQL 和 Redis。
5. 等待 PostgreSQL 和 Redis ready。
6. 生成 Prisma Client。
7. 执行已有 Prisma migration。
8. 检查 API/Web 端口：如果服务已健康运行则提示并跳过重复启动；如果端口被未知进程占用则输出占用进程并退出。
9. 按需启动前端和/或后端开发服务器。

## 停止基础设施

```bash
pnpm stop
```

## 健康检查

```bash
pnpm doctor
```

## 当前端口

- Web: `http://localhost:5173`
- API: `http://localhost:3000/api`
- PostgreSQL: `localhost:55432`
- Redis: `localhost:6380`
