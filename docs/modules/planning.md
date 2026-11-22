# Planning 模块

## 职责

Planning 管理小说的结构规划层：用 Volume 表达分卷 / 故事单元，用 ChapterPlan 表达正式章节创建前的轻量计划。

P1 的目标是把“想写什么、属于哪个故事单元、是否已确认、是否已转成正式章节”落到可编辑数据里，而不是实现 AI 生成或复杂编排系统。

## 核心实体

### Volume = StoryUnit

`Volume` 在本项目中等同于 StoryUnit：

- 可以是传统分卷。
- 也可以是故事阶段、篇章、任务线、地图区域或作者自定义的故事单元。
- P1 不新增 `StoryUnit` 表，避免与既有 `Volume` 重复。
- P1 不新增 `VolumePlan`，Volume 只保存标题、目标、简介、状态、排序等轻量信息。

### ChapterPlan

`ChapterPlan` 是章节创建前的轻量计划，不是正文版本，也不替代 Chapter：

- 可选归属 `Volume`。
- 可选绑定正式 `Chapter`。
- 字段保持轻量：标题、目标、大纲、POV、约束、排序、状态、正史状态、来源信息。
- `status` 表达工作流状态：`planned / confirmed / archived`。
- `canonStatus` 表达是否进入可采信资料：`draft / confirmed / archived`。
- `sourceType/sourceId` 只用于追溯来源，不连接模型或生成任务。

## P1 / P2 / P3 边界

### P1：人工规划闭环

P1 只做人工维护闭环：

1. Volume 列表 / 新建 / 详情 / 编辑 / 删除 / 重排。
2. ChapterPlan 列表 / 新建 / 详情 / 编辑 / 删除。
3. ChapterPlan confirm / archive / restore。
4. 从 ChapterPlan 创建正式 Chapter，并回填 `chapterId`。
5. Service 层校验 project 边界、Volume 与 Chapter 同项目、Volume/Chapter 一致性、软删除过滤。
6. 工作台新增“规划”模块，提供左中右轻量 UI。

### P2：结构增强

P2 可评估：

- 计划与场景、摘要、上下文预览的更深联动。
- 更细的计划状态流转和批量操作。
- 更完善的章节计划质量检查。

### P3：高级编排

P3 才考虑：

- 复杂拖拽树。
- Timeline / Novel Time System。
- 工作流图谱和跨线索排布。
- AI 自动规划、多版本规划或大纲生成。

## 不负责什么

1. 不做 AI 生成按钮。
2. 不接模型。
3. 不做 VolumePlan。
4. 不做 Timeline / Novel Time System。
5. 不做复杂拖拽树。
6. 不扩展 Context Builder 实现。
7. 不扩展 PromptRender / GenerationTask。

## 规则

1. `Volume` 是 StoryUnit 的当前实现；不要再新增平行的故事单元表。
2. `ChapterPlan` 是生成前计划，不应混入 Chapter 正文版本。
3. `ChapterPlan` 可以绑定 Chapter，也可以先独立存在。
4. 从计划创建章节时，必须建立 `ChapterPlan.chapterId` 关系，并保持 project / volume 边界一致。
5. PATCH 只能写 allow-list 字段，不允许夹带 `projectId`、`chapterId`、`canonStatus`、`deletedAt` 等受控字段。
6. Context Builder 后续生成章节时应优先读取已确认的 ChapterPlan，但 P1 不实现 Context Builder。
7. 不允许只用 `Chapter.goal` 替代规划层。
