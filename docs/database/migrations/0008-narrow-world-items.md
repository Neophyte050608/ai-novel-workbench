# 0008 - Narrow WorldItem to Generic Settings

## 背景

`WorldItem` 已从“大一统世界观容器”收窄为通用世界设定，地点、势力、物种、剧情道具和世界规则分别由一等实体承载。本次迁移只补齐通用设定所需类型和通用字段，不自动迁移历史数据。

## Schema 变更

1. `WorldItemType` 保留既有历史值：`location`、`organization`、`rule`、`magic_system`、`technology`、`item`、`character_note`、`timeline_event`、`species` 等。
2. `WorldItemType` 新增通用设定值：
   - `system`
   - `culture`
   - `concept`
   - `social_system`
3. `WorldItem` 新增通用字段：
   - `visibility`：叙事可见性或作者侧可见性说明。
   - `sourceType`：来源类型，例如 user / imported / generation_task。
   - `sourceId`：来源记录 ID。

## 数据策略

1. 不删除旧 enum 值。
2. 不把历史 `WorldItem(type=location/organization/species/item/rule/...)` 自动迁移到一等实体。
3. 后续如需整理历史数据，应通过专门导入/人工确认流程完成，避免误判语义。
4. 新建 WorldItem 入口只允许 `system`、`history`、`culture`、`concept`、`social_system`、`custom`。

## 影响范围

- 后端 API 对新建和类型更新做通用设定类型白名单校验。
- 前端工作台新增“通用设定”模块并接入 WorldItem API。
- Relationship 仍可连接历史和新建 `world_item`，用于背景解释、体系归属和制度影响等关系。
