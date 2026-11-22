# Chapters 模块

## 职责

管理章节元信息、章节正文版本、当前正文指针和读者最终看到的章节正文闭环。

- **Chapter**：章节元信息和发布/阅读单位，承载标题、排序、状态、目标、摘要指针等，不直接作为正文唯一存储点。
- **ChapterVersion**：章节正文版本。每次手动编辑、导入、AI 生成（后续）或从 Scene 装配出的完整章节正文，都必须落到 ChapterVersion。
- **SceneVersion**：内部创作颗粒度的场景正文版本。P1 支持把同一 Chapter 下各 Scene 的当前 SceneVersion 按顺序拼接，生成一个 ChapterVersion。
- **ChapterSummary**：章节级摘要。P1 支持人工维护和从已确认 SceneSummary 汇总，服务章节工作台查看与后续人工整理；它不是长期小说记忆 `MemoryRecord`，P1 不写入 MemoryRecord / EvidenceRef。

## 核心实体

- Chapter
- ChapterVersion
- Scene
- SceneVersion
- ChapterSummary

## 规则

1. Chapter 是章节元信息和发布/阅读单位，不直接保存或覆盖正文。
2. 读者最终看到的一章完整正文必须保存为 ChapterVersion。
3. `Chapter.currentVersionId` 是当前正文指针；激活版本时必须校验版本属于同 project / chapter。
4. 手动编辑正文必须创建新的 ChapterVersion，可选择同时激活为当前版本。
5. Scene 是内部创作颗粒度；SceneVersion 可装配为 ChapterVersion，但 P1 不新增 `ChapterVersionSceneVersion` join 表。
6. 从场景装配时，只读取当前 Chapter 下未删除 Scene，按 `orderIndex` 排序，取各 Scene 的 `currentVersionId` 对应未删除 SceneVersion.content 拼接。
7. 如果任一 Scene 缺少 `currentVersionId`，或指向的 SceneVersion 已软删除 / 不属于同 project / chapter / scene，必须返回清晰错误，不生成半成品版本。
8. ChapterSummary 是章节级摘要，只记录本章摘要、关键事件、人物变化和新增事实；P1 支持人工维护和从 SceneSummary 汇总。
9. 从场景摘要汇总时，只读取当前 Chapter 下未删除 Scene 的已确认 SceneSummary；若任一 Scene 缺少 confirmed SceneSummary，必须返回清晰错误，不回退到 draft。
10. ChapterSummary 可绑定 `Chapter.currentVersionId` 对应 ChapterVersion，但不强制；手动摘要可不绑定版本。
11. ChapterSummary 的 `canonStatus` 表示摘要草稿 / 已确认 / 已归档；删除必须软删除 `deletedAt`，恢复后回到 draft。
12. ChapterSummary 不是长期小说记忆记录。P1 不写 MemoryRecord / EvidenceRef，不接 Context Builder。
13. P1 不考虑多人协作，不做锁、评论、审阅流和作者权限拆分。
14. P1 不做 AI 生成、不接模型、不做 PromptRender / ContextBuilder、不做发布平台、不做复杂富文本编辑器。
15. 如果需要标记“从场景装配”，但 `ChapterVersionSource` enum 暂无 `assembled`，P1 使用 `source=user`，并用 `changeSummary=assembled from current scene versions` 标记来源。

## P1 API

```txt
GET    /projects/:projectId/chapters/:chapterId/versions
POST   /projects/:projectId/chapters/:chapterId/versions
GET    /projects/:projectId/chapter-versions/:versionId
PATCH  /projects/:projectId/chapter-versions/:versionId
POST   /projects/:projectId/chapters/:chapterId/versions/:versionId/activate
POST   /projects/:projectId/chapters/:chapterId/assemble-from-scenes
GET    /projects/:projectId/chapters/:chapterId/summaries
POST   /projects/:projectId/chapters/:chapterId/summaries
GET    /projects/:projectId/chapter-summaries/:summaryId
PATCH  /projects/:projectId/chapter-summaries/:summaryId
DELETE /projects/:projectId/chapter-summaries/:summaryId
POST   /projects/:projectId/chapter-summaries/:summaryId/confirm
POST   /projects/:projectId/chapter-summaries/:summaryId/archive
POST   /projects/:projectId/chapter-summaries/:summaryId/restore
POST   /projects/:projectId/chapters/:chapterId/summaries/rollup-from-scenes
GET    /projects/:projectId/chapters/:chapterId/profile
```

### 创建 ChapterVersion

`POST /projects/:projectId/chapters/:chapterId/versions`

- `content` 必填，保存完整章节正文。
- `source` 可选，P1 主要使用 `user`。
- `changeSummary` 可选，记录版本说明。
- 不更新 Chapter 正文；只有调用 activate 才更新 `Chapter.currentVersionId`。

### 激活 ChapterVersion

`POST /projects/:projectId/chapters/:chapterId/versions/:versionId/activate`

- 校验 Chapter 属于 project 且未删除。
- 校验 ChapterVersion 属于该 Chapter。
- 成功后更新 `Chapter.currentVersionId`。

### 从 Scene 装配 ChapterVersion

`POST /projects/:projectId/chapters/:chapterId/assemble-from-scenes`

请求体：

```json
{
  "includeSceneTitles": false,
  "activate": false,
  "changeSummary": "optional note"
}
```

处理规则：

1. 查询当前 chapter 下未删除 scenes。
2. 按 `orderIndex asc, createdAt asc` 排序。
3. 对每个 scene 校验并读取 `scene.currentVersionId` 对应的未删除 SceneVersion。
4. 拼接 SceneVersion.content，生成新的 ChapterVersion。
5. `includeSceneTitles=true` 时，在每个场景正文前加入轻量 markdown 标题。
6. `activate=true` 时，创建后同步设置为 Chapter 当前版本。

## 章节摘要 ChapterSummary

P1 章节摘要闭环只做两件事：

1. 人类可维护的章节级摘要：用户可新增、编辑、软删除、确认、归档、恢复 ChapterSummary。
2. 从 SceneSummary 汇总：系统按场景顺序拼接/组合已确认 SceneSummary，生成一个 draft ChapterSummary。

字段使用：

- `summary`：章节摘要正文，可包含按场景分段的结构化文本。
- `keyEvents` / `characterChanges` / `newFacts`：JSON 数组或对象；从 SceneSummary 汇总时会组合为数组，并保留来源 sceneId / sceneTitle / sceneOrderIndex。
- `canonStatus`：`draft` / `confirmed` / `archived`。
- `chapterVersionId`：可选。汇总时如果 `Chapter.currentVersionId` 存在，则绑定当前 ChapterVersion；手动摘要允许为空。
- `sourceType` / `sourceId`：来源追溯。场景摘要汇总使用 `sourceType=sceneSummaryRollup`，`sourceId` 存储参与汇总的 SceneSummary id 列表。
- `createdBy`：P1 使用 `user` 或 `system`。
- `deletedAt`：软删除。

### 从 SceneSummary 汇总 ChapterSummary

`POST /projects/:projectId/chapters/:chapterId/summaries/rollup-from-scenes`

处理规则：

1. 查询当前 chapter 下未删除 scenes。
2. 按 `orderIndex asc, createdAt asc` 排序。
3. 对每个 scene 读取最新 confirmed 且未删除的 SceneSummary。
4. 若任一 scene 没有 confirmed SceneSummary，返回清晰错误，不使用 draft fallback，不生成半成品摘要。
5. 将各 SceneSummary.summary 拼接成按场景标题分段的文本。
6. 将 SceneSummary.keyEvents / characterChanges / newFacts 合并为 JSON 数组，并附带来源 scene 信息。
7. 创建 draft ChapterSummary；如 chapter.currentVersionId 存在则绑定该 ChapterVersion。
8. 不调用 AI，不写 MemoryRecord / EvidenceRef。

### Chapter profile 摘要信息

`GET /projects/:projectId/chapters/:chapterId/profile` 返回：

- `summaries`：当前章节未删除 ChapterSummary 列表。
- `latestSummary`：最新 confirmed ChapterSummary。
- `currentSummary`：优先返回绑定当前 ChapterVersion 的 confirmed ChapterSummary；没有时回退到 latestSummary。
- `stats.summaryCount`：未删除摘要数量。

## 与生成链路关系

P1 不实现 AI 生成链路。后续生成结果也必须先进 ChapterVersion，再由用户确认或流程动作激活；ChapterSummary 仍由人工维护或场景摘要汇总生成，不自动写长期记忆：

```txt
GenerationTask -> ChapterVersion -> Chapter.currentVersionId -> ChapterSummary
```

Scene 装配链路：

```txt
Scene.currentVersionId -> SceneVersion.content -> ChapterVersion.content -> Chapter.currentVersionId
```
