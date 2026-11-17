# StoryItems 模块

## 状态说明

本文是 `StoryItem` 一等实体的占位 / 初版设计文档，用于记录职责边界和后续待细分字段；不表示 schema、API 或 UI 已实现。

## 职责

`StoryItem` 用于管理对剧情有叙事作用的道具、物品和载体，例如：

- 神器、装备、法宝、武器、钥匙。
- 信物、线索物、证据、地图、书信。
- 容器、封印物、媒介、核心能源。
- 科技装置、AI 载体、特殊资源。

`StoryItem` 关注物品在剧情中的身份、用途、状态和归属变化；抽象物品类别或经济资源制度可归入 `WorldItem`。

## 不负责什么

- 不负责普通背景物资清单；只有有叙事作用的物品才进入 `StoryItem`。
- 不负责持有人、所在地、绑定对象等多变关系；这些通过 `Relationship` 表达。
- 不负责规则本身，例如使用限制、世界法则；这些应归入 `WorldRule` 或 `WorldItem` 后再关联。

## 统一字段原则

后续字段设计应遵循世界观实体统一字段原则：

- `projectId`
- `name`
- `aliases`
- `summary`
- `description`
- `status`
- `visibility`
- `importance`
- `canonStatus`
- `sourceType` / `sourceId`
- `createdAt` / `updatedAt` / `deletedAt`

## 后续待细分字段方向

后续可进一步评估：

- `kind`：道具类型，例如 weapon/artifact/key/evidence/document/device/resource。
- `appearance`：外观。
- `function`：功能或用途。
- `origin`：来历。
- `limitations`：使用限制。
- `condition`：状态，例如完整、破损、封印、耗尽。
- `currentState`：当前剧情状态缓存。

这些字段需要在正式 schema 设计阶段再确认，不应在本文中视为已实现。

## Relationship 边界

以下关系应由 `Relationship` 承载：

- 角色拥有 / 使用 / 寻找 / 失去 / 被绑定到某道具。
- 道具存放于 / 失落于 / 起源于某地点。
- 势力持有 / 争夺 / 守护 / 封印某道具。
- 道具克制、激活或违反某世界规则。
- 道具属于某体系、历史或文化设定。
