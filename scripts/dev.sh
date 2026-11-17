#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

API_PORT="${API_PORT:-3000}"
WEB_PORT="${WEB_PORT:-5173}"

log() {
  printf '\033[1;36m[ai-novel]\033[0m %s\n' "$1"
}

fail() {
  printf '\033[1;31m[ai-novel]\033[0m %s\n' "$1" >&2
  exit 1
}

port_in_use() {
  local port="$1"
  lsof -nP -iTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1
}

print_port_owner() {
  local port="$1"
  lsof -nP -iTCP:"$port" -sTCP:LISTEN >&2 || true
}

api_healthy() {
  curl -fsS "http://localhost:${API_PORT}/api/health" >/dev/null 2>&1
}

web_healthy() {
  curl -fsS "http://localhost:${WEB_PORT}" >/dev/null 2>&1
}

ensure_app_port_available_or_healthy() {
  local name="$1"
  local port="$2"
  local health_fn="$3"

  if "$health_fn"; then
    log "${name} is already healthy on port ${port}; it will not be started again."
    return 0
  fi

  if port_in_use "$port"; then
    echo "Port ${port} is occupied, but ${name} health check did not pass. Unknown process details:" >&2
    print_port_owner "$port"
    fail "Stop the process on port ${port}, or change the ${name} port, then run pnpm start:dev again."
  fi
}

if ! command -v pnpm >/dev/null 2>&1; then
  fail "pnpm is required. Install it first: corepack enable && corepack prepare pnpm@latest --activate"
fi

if ! command -v docker >/dev/null 2>&1; then
  fail "Docker is required for PostgreSQL/Redis."
fi

if ! command -v curl >/dev/null 2>&1; then
  fail "curl is required for health checks."
fi

if ! command -v lsof >/dev/null 2>&1; then
  fail "lsof is required for port diagnostics."
fi

if [ ! -f .env ]; then
  log "Creating .env from .env.example"
  cp .env.example .env
fi

if [ ! -f apps/api/.env ]; then
  log "Creating apps/api/.env from .env.example"
  cp .env.example apps/api/.env
fi

if [ ! -d node_modules ]; then
  log "Installing dependencies"
  pnpm install
fi

log "Starting PostgreSQL and Redis"
docker compose up -d postgres redis

log "Waiting for PostgreSQL"
for i in {1..30}; do
  if docker compose exec -T postgres pg_isready -U ai_novel -d ai_novel_workbench >/dev/null 2>&1; then
    break
  fi
  sleep 1
  if [ "$i" -eq 30 ]; then
    fail "PostgreSQL did not become ready in time. Run pnpm doctor for diagnostics."
  fi
done

log "Waiting for Redis"
for i in {1..30}; do
  if docker compose exec -T redis redis-cli ping >/dev/null 2>&1; then
    break
  fi
  sleep 1
  if [ "$i" -eq 30 ]; then
    fail "Redis did not become ready in time. Run pnpm doctor for diagnostics."
  fi
done

log "Generating Prisma Client"
pnpm db:generate

log "Applying existing Prisma migrations"
pnpm --filter @ai-novel/api exec prisma migrate deploy

ensure_app_port_available_or_healthy "API" "$API_PORT" api_healthy
ensure_app_port_available_or_healthy "Web" "$WEB_PORT" web_healthy

api_running=false
web_running=false
if api_healthy; then api_running=true; fi
if web_healthy; then web_running=true; fi

if [ "$api_running" = true ] && [ "$web_running" = true ]; then
  log "API and Web are already running and healthy; startup skipped."
  exit 0
fi

if [ "$api_running" = false ] && [ "$web_running" = false ]; then
  log "Starting web + api dev servers"
  exec pnpm dev
fi

if [ "$api_running" = false ]; then
  log "Web is already running; starting API dev server only"
  exec pnpm dev:api
fi

log "API is already running; starting Web dev server only"
exec pnpm dev:web
