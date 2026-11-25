# Chapter Writing Workspace / 章节写作工作台

> 状态：设计稿 v0.1 approved direction  
> 日期：2026-11-25  
> 范围：章节内日常写作主入口、场景写作闭环、章节正文装配与摘要确认  
> 不包含：AI 模型接入实现、PromptRender / ContextBuilder 实现、富文本编辑器、多人协作、发布平台、复杂拖拽编排

---

## 1. 模块定位

`Chapter Writing Workspace / 章节写作工作台` 是作者日常写一章的主入口。

它不是新的正文表，也不是替代 `Chapter` / `Scene` 的领域模型；它是把已有章节、场景、正文版本、摘要、交接能力收敛到同一个作者工作流里。

作者的心智不是：

```txt
管理 Chapter 表
管理 Scene 表
再回 Chapter 表装配
```

而是：

```txt
我正在写第 3 章
  -> 这章有 4 个场景
  -> 我按顺序写场景 1、2、3、4
  -> 每场写完沉淀摘要和交接
  -> 最后装配成本章正文
  -> 确认章节摘要
```

因此，章节写作工作台的核心职责是：

```txt
在一个章节上下文内完成：
章节目标 -> 本章场景 -> 场景正文 -> 场景摘要/交接 -> 章节正文装配 -> 章节摘要
```

---

## 2. 职责边界

### 2.1 负责什么

1. 展示当前项目下的章节列表。
2. 选中章节后展示本章写作进度。
3. 在章节上下文内管理本章场景列表。
4. 在章节上下文内编辑场景基础信息、场景计划、场景正文版本、场景摘要、场景交接。
5. 展示本章装配阻塞项，并允许点击定位到对应场景和具体 Tab。
6. 从本章 `Scene.currentVersionId` 装配 `ChapterVersion`。
7. 手动编辑完整章节正文并保存为 `ChapterVersion`。
8. 激活章节正文版本，更新 `Chapter.currentVersionId`。
9. 手动维护 `ChapterSummary`。
10. 从 confirmed `SceneSummary` 汇总 `ChapterSummary`。
11. 为后续 AI 生成链路提供清晰入口和状态判断。

### 2.2 不负责什么

P1 不做：

1. AI 生成实现。
2. 模型接入。
3. PromptRender / ContextBuilder。
4. MemoryRecord / EvidenceRef 写入。
5. 富文本编辑器。
6. 多人协作、锁、评论、审阅流。
7. 发布平台接入。
8. 复杂拖拽排序。
9. ChapterVersionSceneVersion 追溯表。
10. Beat / Promise-Payoff / Timeline 等高级结构。

---

## 3. 与 Chapter / Scene 模块的关系

### 3.1 Chapter 模块

`docs/modules/chapters.md` 负责领域模型：

```txt
Chapter
ChapterVersion
ChapterSummary
```

它回答：章节正文怎么存、版本怎么激活、摘要怎么汇总。

### 3.2 Scene 模块

`docs/modules/scenes.md` 负责场景领域模型：

```txt
Scene
ScenePlan
SceneVersion
SceneSummary
SceneHandoff
```

它回答：场景如何计划、写正文、沉淀摘要、交接下一场。

### 3.3 Chapter Writing Workspace

章节写作工作台负责产品工作流：

```txt
作者如何在第 N 章里连续完成这些动作
```

它不创造新的核心关系，不用自由 JSON 替代关系，也不绕过 Chapter / Scene Service 边界。

---

## 4. 信息架构

P1 推荐三块结构：

```txt
章节写作
├── 左侧：章节列表
├── 中间：写作主区
│   ├── 写作流
│   │   ├── 本章场景列表
│   │   └── 当前场景详情
│   │       ├── 计划
│   │       ├── 正文
│   │       ├── 摘要
│   │       └── 交接
│   ├── 章节正文
│   ├── 章节摘要
│   └── 版本记录
└── 右侧：上下文/下一步面板
    ├── 本章目标
    ├── 装配阻塞
    └── 下一步建议
```

### 4.1 顶部区域

顶部展示当前选中章节的写作状态：

```txt
第 3 章：入城前夜
写作中 · 4/6 场景有正文 · 3/6 场景已确认摘要 · 2/6 场景有交接 · 当前正文已存在
```

主按钮根据状态动态变化：

| 状态 | 主按钮 |
|---|---|
| 没有章节 | 新增章节 |
| 本章没有场景 | 添加第一个场景 |
| 有场景缺正文 | 继续写场景 |
| 所有场景有正文且无当前章节正文 | 装配章节正文 |
| 有章节正文但无章节摘要 | 汇总章节摘要 |
| 本章正文与摘要都就绪 | 进入下一章 |

### 4.2 左侧章节列表

每个章节卡片展示：

```txt
第 3 章：入城前夜
写作中
场景 4/6 有正文 · 摘要 3/6 · 交接 2/6
当前正文：有
```

空状态文案：

```txt
先创建章节。创建后可以直接在这里添加本章场景并开始写作。
```

### 4.3 中间 Tabs

P1 建议 Tabs：

```txt
写作流 / 章节正文 / 章节摘要 / 版本记录 / 概览
```

默认进入 `写作流`，不要默认停留在数据库式概览。

---

## 5. 写作流 Tab

`写作流` 是 P1 的核心。

### 5.1 本章场景列表

场景列表展示本章所有未删除 Scene，按 `orderIndex asc, createdAt asc` 排序。

每个场景卡片展示：

```txt
#3 发现通缉令
目标：主角第一次意识到自己已被追捕
正文 有 · 摘要 待确认 · 交接 缺失
POV：林澈 · 地点：王都城门
```

状态标签建议：

| 数据状态 | 展示文案 |
|---|---|
| 无当前计划 | 缺计划 |
| 有当前计划 | 有计划 |
| 无当前正文 | 缺正文 |
| 有当前正文 | 有正文 |
| 无摘要 | 缺摘要 |
| 有摘要但未 confirmed | 摘要待确认 |
| 有 confirmed 摘要 | 摘要已确认 |
| 无交接 | 缺交接 |
| 有交接 | 有交接 |

P1 轻筛选：

```txt
全部 / 有阻塞 / 缺正文 / 缺摘要 / 缺交接
```

### 5.2 当前场景详情

选中场景后展示场景详情。内部 Tabs：

```txt
计划 / 正文 / 摘要 / 交接
```

#### 计划

展示当前 ScenePlan，并支持：

```txt
新增计划
编辑计划
设为当前
```

空状态文案：

```txt
还没有场景计划。先写清楚这场要完成什么，再进入正文会更稳。
```

#### 正文

展示当前 SceneVersion，并支持：

```txt
写场景正文
保存为新场景正文版本
设为当前正文
查看历史版本
```

空状态文案：

```txt
这个场景还没有正文。写完后，它会参与章节正文装配。
```

#### 摘要

展示 SceneSummary，并支持：

```txt
新增摘要
编辑摘要
确认摘要
归档摘要
恢复摘要
删除摘要
```

空状态文案：

```txt
还没有场景摘要。确认摘要后，本章才能稳定汇总章节摘要。
```

未确认提示：

```txt
这条摘要还没有确认。未确认摘要不会作为可靠上下文使用。
```

#### 交接

展示 SceneHandoff，并支持：

```txt
新增交接
编辑交接
确认交接
归档交接
恢复交接
删除交接
指向下一场
```

空状态文案：

```txt
还没有场景交接。交接用于提醒下一场必须接住的变化、悬念和风险。
```

---

## 6. 章节正文 Tab

章节正文 Tab 负责最终读者看到的一章。

### 6.1 从场景装配

说明文案：

```txt
按场景顺序读取每个场景的当前正文，拼接为新的章节正文版本。
```

配置：

```txt
包含场景标题
装配后设为当前章节正文
```

硬阻塞：

1. 本章无场景。
2. 任一场景无 `currentVersionId`。
3. 任一 current SceneVersion 已软删除或跨 project / chapter / scene。

软提醒：

1. 场景摘要未确认。
2. 场景交接缺失。
3. 章节摘要缺失。

硬阻塞禁止装配，软提醒不禁止装配。

### 6.2 手动章节正文

说明文案：

```txt
这里是读者最终看到的章节正文。保存会生成新的章节版本，不会覆盖历史版本。
```

操作：

```txt
保存为新章节版本
保存后设为当前章节正文
```

---

## 7. 章节摘要 Tab

章节摘要用于记录本章已经发生的关键变化，供后续章节引用。

操作：

```txt
新增章节摘要
编辑章节摘要
确认章节摘要
归档章节摘要
恢复章节摘要
删除章节摘要
从场景摘要汇总
```

汇总规则沿用 Chapters 模块：

```txt
只读取 confirmed SceneSummary
缺失 confirmed 时清晰报错
不调用 AI
不写 MemoryRecord
```

---

## 8. 版本记录 Tab

展示 ChapterVersion 历史。

每项展示：

```txt
当前章节正文
6,820 字 · 手动保存/场景装配/AI 辅助 · 创建时间
变更说明
预览/编辑
设为当前
```

P1 若 `source` 无 `assembled`，通过 `changeSummary` 显示“从场景装配生成”。

---

## 9. 右侧上下文面板

右侧面板只做提醒和跳转，不做复杂编辑。

### 9.1 本章目标

展示：

```txt
Chapter.goal
关联 ChapterPlan 的目标/大纲（若存在）
```

### 9.2 装配阻塞

阻塞分两类。

#### 硬阻塞

会阻止装配：

```txt
本章还没有场景
#2 盘查冲突：缺少当前正文
#4 临时躲藏：当前正文版本不可用
```

点击后定位到对应场景和 `正文` Tab。

#### 软提醒

不阻止装配，但提示连续性资料未补齐：

```txt
#3 发现通缉令：摘要未确认
#5 客栈试探：缺少交接
本章还没有已确认章节摘要
```

点击后定位到对应场景或章节摘要 Tab。

### 9.3 下一步建议

推荐顺序：

1. 无章节：新增章节。
2. 本章无场景：添加第一个场景。
3. 有场景缺计划：补场景计划。
4. 有场景缺正文：写场景正文。
5. 场景摘要未确认：确认场景摘要。
6. 场景缺交接：补场景交接。
7. 全部场景有正文：装配章节正文。
8. 有章节正文但无章节摘要：汇总章节摘要。
9. 本章完成：进入下一章。

---

## 10. 独立 SceneWorkspace 的新定位

SceneWorkspace 保留，但不再作为日常写作主入口。

推荐命名：

```txt
场景库
```

定位：

```txt
跨章节检索、筛选和批量维护场景。日常写作请从章节写作进入。
```

保留职责：

1. 跨章节查看场景。
2. 按章节、状态、POV、地点筛选场景。
3. 查找缺正文 / 缺摘要 / 缺交接的场景。
4. 批量维护状态、排序、归属。
5. 跨章节 SceneHandoff 链检查。
6. 长篇结构健康看板。

---

## 11. 后续 AI 生成链路

P1 不实现 AI，但 UI 和状态设计必须为 AI 链路预留位置。

推荐链路：

```txt
ChapterPlan
  -> Scene + ScenePlan
  -> SceneVersion
  -> SceneSummary + SceneHandoff
  -> ChapterVersion
  -> ChapterSummary
```

### 11.1 生成章节计划

输入：

```txt
Project
Volume / StoryUnit
上一章 confirmed ChapterSummary
当前 Chapter 元信息
相关角色/地点/势力/规则摘要
```

输出：

```txt
ChapterPlan draft
```

用户确认后进入 confirmed。

### 11.2 生成场景计划

输入：

```txt
confirmed ChapterPlan
Chapter
前文 ChapterSummary
预期场景数量
相关资产
```

输出：

```txt
Scene
ScenePlan
Scene.currentPlanId
```

### 11.3 生成场景正文

输入：

```txt
ScenePlan
ChapterPlan
上一场 confirmed SceneSummary
上一场 confirmed SceneHandoff
本章前面已完成 SceneSummary
相关人物/地点/势力/规则
```

输出：

```txt
SceneVersion
```

用户确认后更新：

```txt
Scene.currentVersionId
```

### 11.4 生成场景摘要和交接

输入：

```txt
SceneVersion.content
ScenePlan
ChapterPlan
上一场 Handoff
```

输出：

```txt
SceneSummary draft
SceneHandoff draft
```

用户确认后：

```txt
SceneSummary.canonStatus = confirmed
SceneHandoff.canonStatus = confirmed
```

### 11.5 装配章节正文

输入：

```txt
本章所有 Scene.currentVersionId 对应 SceneVersion.content
```

输出：

```txt
ChapterVersion
```

用户选择是否激活：

```txt
Chapter.currentVersionId = ChapterVersion.id
```

### 11.6 生成/汇总章节摘要

输入：

```txt
confirmed SceneSummary[]
Chapter.currentVersionId 对应 ChapterVersion.content
ChapterPlan
```

输出：

```txt
ChapterSummary draft
```

用户确认后成为后续 Context Builder 的可靠输入。

---

## 12. P1 验收标准

给定用户正在写第 3 章：

1. 用户不离开章节页，可以看到第 3 章所有场景。
2. 用户不离开章节页，可以新增第 3 章场景。
3. 用户不离开章节页，可以编辑场景基础信息。
4. 用户不离开章节页，可以新增/编辑/激活场景计划。
5. 用户不离开章节页，可以创建并激活场景正文版本。
6. 用户不离开章节页，可以新增/编辑/确认/归档/恢复/删除场景摘要。
7. 用户不离开章节页，可以新增/编辑/确认/归档/恢复/删除场景交接。
8. 用户可以看到本章哪些场景阻塞章节装配。
9. 阻塞项可以点击定位到对应场景和具体处理 Tab。
10. 所有场景有 currentVersion 后，用户可以一键装配 ChapterVersion。
11. 装配后可以选择激活为 `Chapter.currentVersionId`。
12. 用户可以从 confirmed SceneSummary 汇总 ChapterSummary。
13. 用户可以确认 ChapterSummary。
14. 独立 SceneWorkspace 文案调整为“场景库”，不再暗示它是日常写作必经入口。
15. P1 不出现 AI 自动生成按钮、多人协作、富文本、发布平台入口。

---

## 13. P2 / P3

### P2

1. Scene-aware Context Builder。
2. `GenerationTask.sceneId` / `ContextSnapshot.sceneId`。
3. 生成 ScenePlan。
4. 生成 SceneVersion。
5. 生成 SceneSummary / SceneHandoff。
6. 从 AI 结果生成 ChapterVersion。
7. ChapterVersionSceneVersion 追溯表。
8. 版本 diff 和重写。

### P3

1. Beat。
2. Promise / Payoff 独立实体。
3. PlotThread。
4. Timeline。
5. Continuity Review。
6. MemoryRecord 深度接入。
7. 场景关系图。
8. 工作流编辑器。
9. 发布 / 导出。
