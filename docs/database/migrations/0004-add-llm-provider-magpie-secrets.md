# Migration 0004: add-llm-provider-magpie-secrets

## 背景

模型接入层第一版采用 Magpie-first 方案：用户在设置页连接 Magpie 本地网关，并选择 Magpie 中已经配置好的模型。

该能力需要让 LLMProvider 明确区分 Provider 类型、保存 Magpie baseUrl/model 等非敏感配置，并为 Gateway Key / API Key 提供独立 SecretStore。Gateway Key 不允许明文保存在 `LLMProvider.config`，也不允许前端回显。

## 变更内容

新增 enum：

- `LLMProviderType`
  - `magpie`
  - `mock`

调整 `LLMProvider`：

- `type` 从 `String` 调整为 `LLMProviderType`
- 新增 `secretRef String?`
- 新增 `deletedAt DateTime?`
- 新增索引：
  - `[projectId, isDefault]`
  - `[deletedAt]`

新增表：

- `SecretCredential`

字段：

- `id`
- `ref`
- `encryptedValue`
- `iv`
- `authTag`
- `algorithm`
- `createdAt`
- `updatedAt`

其中 `ref` 唯一，用于被 `LLMProvider.secretRef` 引用。

## 数据迁移策略

当前项目处于本地 MVP 开发阶段，尚未正式使用 LLMProvider 保存真实 Provider 配置。

Prisma 生成的 migration 会重建 `LLMProvider.type` 列。如果已有历史 LLMProvider 数据，需要先把旧的 String 值人工归一到：

- `magpie`
- `mock`

否则旧值无法安全映射到 enum。

本阶段数据库中没有历史 LLMProvider 数据，因此允许直接迁移。

## Secret 管理策略

`SecretCredential` 只保存加密后的 Gateway Key / API Key。

约束：

1. 不保存明文 key。
2. 不通过 `LLMProvider.config` 保存 key。
3. API 返回中不包含 key 原文。
4. 前端只展示“已配置 / 未配置”。
5. 后续 SecretStore 实现负责加密、解密和脱敏。

推荐 `secretRef` 格式：

```txt
llm-provider:<providerId>:gateway-key
```

## 回滚策略

开发阶段可通过 Prisma reset 回滚。

如果需要手动回滚，需要：

1. 删除 `SecretCredential` 表。
2. 删除 `LLMProvider.secretRef`、`LLMProvider.deletedAt`。
3. 将 `LLMProvider.type` 从 enum 改回 String。
4. 删除 `LLMProviderType` enum。

生产环境暂不建议直接回滚 Secret 表，因为可能造成已保存 Gateway Key 丢失。

## 风险

1. `LLMProvider.type` 从 String 改 enum 后，不再接受任意字符串。
2. 已有历史 Provider 数据如果存在非 `magpie/mock` 类型，需要先清洗。
3. SecretCredential 只提供数据结构，不代表加密实现已经完成。
4. 如果后续增加 Provider 类型，必须新增 enum 值并走 Prisma Migrate。

## 验证方式

- [x] `pnpm --filter @ai-novel/api exec prisma format` 成功
- [x] `pnpm --filter @ai-novel/api exec prisma migrate dev --name add_llm_provider_magpie_secrets` 成功
- [x] Prisma Client generate 成功
- [ ] SecretStore 实现后验证 key 不回显
- [ ] Provider API 实现后验证只返回 `hasGatewayKey` / `hasApiKey`
- [ ] Magpie discover/models/test API 实现后验证本地 Magpie 接入
