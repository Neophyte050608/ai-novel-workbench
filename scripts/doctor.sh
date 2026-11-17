#!/usr/bin/env bash
set -uo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

API_PORT="${API_PORT:-3000}"
WEB_PORT="${WEB_PORT:-5173}"
POSTGRES_PORT="${POSTGRES_PORT:-55432}"
REDIS_PORT="${REDIS_PORT:-6380}"

ok() { printf '  \033[1;32mOK\033[0m %s\n' "$1"; }
warn() { printf '  \033[1;33mWARN\033[0m %s\n' "$1"; }
bad() { printf '  \033[1;31mFAIL\033[0m %s\n' "$1"; }
section() { printf '\n== %s ==\n' "$1"; }

have() {
  command -v "$1" >/dev/null 2>&1
}

port_owner() {
  local port="$1"
  if have lsof; then
    lsof -nP -iTCP:"$port" -sTCP:LISTEN 2>/dev/null || true
  else
    warn "lsof not installed; cannot show process using port ${port}"
  fi
}

check_http() {
  local name="$1"
  local url="$2"
  local port="$3"

  if ! have curl; then
    bad "curl not installed; cannot check ${name} HTTP health"
    return
  fi

  local code
  code="$(curl -fsS -o /dev/null -w '%{http_code}' "$url" 2>/dev/null || true)"
  if [ "$code" = "200" ]; then
    ok "${name} healthy at ${url}"
    return
  fi

  if have lsof && lsof -nP -iTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1; then
    bad "${name} port ${port} is listening but ${url} is not healthy (HTTP ${code:-no response})"
    port_owner "$port"
  else
    bad "${name} is not listening on port ${port}"
  fi
}

section "tools"
for tool in node pnpm docker curl lsof; do
  if have "$tool"; then
    ok "${tool}: $($tool --version 2>/dev/null | head -n 1 || command -v "$tool")"
  else
    bad "${tool} not found"
  fi
done

section "env files"
[ -f .env ] && ok ".env exists" || bad ".env missing"
[ -f apps/api/.env ] && ok "apps/api/.env exists" || bad "apps/api/.env missing"
[ -d node_modules ] && ok "node_modules exists" || warn "node_modules missing; run pnpm install"

section "web"
check_http "Web" "http://localhost:${WEB_PORT}" "$WEB_PORT"

section "api"
check_http "API" "http://localhost:${API_PORT}/api/health" "$API_PORT"

section "containers"
if have docker; then
  docker compose ps || bad "docker compose ps failed"
else
  bad "docker not installed"
fi

section "postgres"
if have docker && docker compose ps postgres >/dev/null 2>&1; then
  if docker compose exec -T postgres pg_isready -U ai_novel -d ai_novel_workbench >/dev/null 2>&1; then
    ok "PostgreSQL container is ready"
  else
    bad "PostgreSQL container is not ready"
  fi
else
  bad "Cannot inspect PostgreSQL container"
fi
if have lsof && lsof -nP -iTCP:"$POSTGRES_PORT" -sTCP:LISTEN >/dev/null 2>&1; then
  ok "PostgreSQL host port ${POSTGRES_PORT} is listening"
else
  bad "PostgreSQL host port ${POSTGRES_PORT} is not listening"
fi

section "redis"
if have docker && docker compose ps redis >/dev/null 2>&1; then
  if docker compose exec -T redis redis-cli ping >/dev/null 2>&1; then
    ok "Redis container responds to ping"
  else
    bad "Redis container does not respond to ping"
  fi
else
  bad "Cannot inspect Redis container"
fi
if have lsof && lsof -nP -iTCP:"$REDIS_PORT" -sTCP:LISTEN >/dev/null 2>&1; then
  ok "Redis host port ${REDIS_PORT} is listening"
else
  bad "Redis host port ${REDIS_PORT} is not listening"
fi

section "prisma"
if have pnpm; then
  if pnpm --filter @ai-novel/api exec prisma generate >/tmp/ai-novel-prisma-generate.log 2>&1; then
    ok "Prisma Client generated"
  else
    bad "Prisma Client generation failed"
    sed 's/^/  /' /tmp/ai-novel-prisma-generate.log
  fi

  if pnpm --filter @ai-novel/api exec prisma migrate status >/tmp/ai-novel-prisma-status.log 2>&1; then
    ok "Prisma migrations are in sync"
    sed 's/^/  /' /tmp/ai-novel-prisma-status.log
  else
    bad "Prisma migration status failed or database is not in sync"
    sed 's/^/  /' /tmp/ai-novel-prisma-status.log
  fi
else
  bad "pnpm not installed; cannot check Prisma"
fi
