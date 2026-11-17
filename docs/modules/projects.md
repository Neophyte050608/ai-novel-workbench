# Projects 模块

## 职责

Projects 是小说工作台的顶层资源，承载一部小说的基础属性和所有下级创作资产。

## 小说基本属性

### 基础信息

| 字段 | 说明 | 是否必填 | 备注 |
|---|---|---:|---|
| `title` | 小说名 | 是 | 用户可手填，后续可由 AI 生成候选 |
| `subtitle` | 副标题 | 否 | 用于补充标题气质 |
| `status` | 项目状态 | 是 | planning / writing / paused / completed / archived |
| `language` | 写作语言 | 是 | MVP 默认 zh-CN |
| `coverAssetId` | 封面资源 | 否 | 后续文件模块接入 |

### 类型标签

类型和标签必须关联有限表，不直接在 Project 上存自由文本。

- `Genre`：主类型/题材，例如东方玄幻、都市、科幻、悬疑。
- `Tag`：标签，例如热血、爽文、无女主、群像、逆袭。
- `ProjectGenre`：小说与类型关联，可标记 primary。
- `ProjectTag`：小说与标签关联。

### 创意设定

| 字段 | 说明 |
|---|---|
| `logline` | 一句话卖点 |
| `premise` | 核心设定/故事成立前提 |
| `coreIdea` | 核心创意/最大看点 |
| `mainPlot` | 主线剧情 |
| `tone` | 情绪基调 |

### 小说内容摘要

| 字段 | 说明 |
|---|---|
| `intro` | 引言 |
| `summary` | 简介 |
| `storySeed` | 核心种子 |
| `worldview` | 世界观摘要，不替代 WorldItem |
| `eraBackground` | 时代背景 |
| `protagonist` | 主角简述，不替代 Character |

### 风格设定

| 字段 | 说明 |
|---|---|
| `writingStyle` | 写作风格 |
| `pov` | 叙事视角 |

### 计划字段

| 字段 | 说明 |
|---|---|
| `targetLength` | 目标篇幅 |
| `estimatedChapters` | 预计章节数 |
| `wordsPerChapter` | 每章字数 |

### 系统字段

- metadata
- createdAt
- updatedAt
- deletedAt

## 不负责

Projects 不负责：

- 章节正文版本管理。
- Prompt 渲染。
- LLM 调用。
- Context 构建。
- 角色、世界观、章节计划的具体生命周期。

## 规则

1. 项目内资源必须带 `projectId`。
2. 删除项目优先软删除。
3. Project 的简介、核心设定、写作风格、基调会进入 Context Builder。
4. Project 不直接存正文。
5. 新建小说是创作入口，不是后台 CRUD 表单。
6. `targetAudience` 暂不作为核心字段。
