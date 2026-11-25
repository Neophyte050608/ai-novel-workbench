# Scene / 场景模块设计

> 状态：设计稿 v0.2 approved  
> 日期：2026-11-18  
> 范围：Scene / 场景结构线  
> 不包含：AI 生成、模型接入、复杂 UI、Memory / Continuity 审稿线、Beat 实体实现

---

## 1. 模块定位

本项目是 AI 小说创作工作台，不是普通 CRUD 后台。

`Scene / 场景` 模块的目标不是给章节增加一个普通子表，而是为长篇小说创作提供更稳定的叙事颗粒度，让后续写作、上下文构建、版本追踪、摘要沉淀和场景交接都有清晰结构。

长篇 AI 小说创作不应从：

```txt
输入 prompt -> 生成一章正文
```

开始。

更可控的链路是：

```txt
建立故事基石
  -> 设计故事单元 / 分卷
  -> 拆章节
  -> 拆场景
  -> 写场景正文
  -> 场景摘要
  -> 场景交接
  -> 推进下一场
```

Scene 模块用于解决：

```txt
上下文漂移
章节目标模糊
人物行动空转
设定无法稳定承接
读者期待没有兑现
后续场景不知道前一场产生了什么后果
```

---


### 1.1 与章节写作工作台的关系

Scene 是章节内的创作颗粒度，但日常写作主入口应是 `Chapter Writing Workspace / 章节写作工作台`。

作者写第 N 章时，应在章节上下文内完成：

```txt
本章场景列表
  -> 场景计划
  -> 场景正文版本
  -> 场景摘要
  -> 场景交接
  -> 装配章节正文
```

独立 SceneWorkspace 保留，但定位调整为“场景库”：

```txt
跨章节检索
批量维护
结构健康检查
跨章 handoff / 连续性视图
```

它不应再作为作者日常写一章时必须进入的主入口。详细产品设计见：[`docs/modules/chapter-writing-workspace.md`](./chapter-writing-workspace.md)。

## 2. 长篇创作方法论

### 2.1 三条链模型

AI 小说工作台需要同时维护三条链。

#### 叙事结构线

```txt
Project
  -> Volume / StoryUnit
  -> Chapter
  -> Scene
  -> Beat
```

说明：

| 层级 | 职责 |
|---|---|
| Project | 一部小说整体 |
| Volume / StoryUnit | 阶段性故事单元 / 分卷 |
| Chapter | 章节 |
| Scene | 场景 |
| Beat | 场景内节拍，后置 |

当前重点是补 `Scene`。

#### 故事资产线

```txt
Character
Location
Faction
Species
WorldRule
StoryItem
Ability
```

这些不是普通资料卡，而是剧情发动机。

示例：

```txt
Character 有目标、弱点、动机
Faction 有利益、边界、敌友关系
Location 有规则、危险、资源
StoryItem 有用途、代价、归属
Ability 有限制、成长、反噬
WorldRule 有约束、例外、后果
```

剧情不是凭空发生的。剧情来自这些资产之间的张力、冲突和变化。

#### 读者体验线

```txt
Promise
  -> Progress
  -> Payoff
  -> Next expectation
```

中文表达：

```txt
承诺
  -> 推进
  -> 兑现
  -> 新期待
```

每个有效场景都应该让读者获得某种价值：

```txt
一个线索
一次情绪推进
一个关系变化
一个局部胜利
一次失败后的新策略
一个规则被揭示
一个承诺被兑现
一个新问题被打开
```

不是每章都要打斗，但每章、每场都不应空转。

---

## 3. Scene 的定义

### 3.1 Scene 是什么

`Scene` 是章节内的具体叙事场景。

但在本项目中，Scene 不只是 Chapter 的子表。

更准确的定义是：

> Scene 是叙事结构线、故事资产线、读者体验线的交汇点。

它表示：

```txt
在某个章节的某个位置，
由某个 POV 角色或叙事焦点引导，
调动一组人物、地点、势力、规则、道具、能力，
让人物为了目标采取行动，
遭遇阻碍，
做出选择，
产生后果，
并推进或兑现读者期待。
```

### 3.2 Scene 必须回答的问题

一个合格 Scene 至少应回答：

```txt
它属于哪一章？
它在本章第几个？
这个场景为什么存在？
谁是 POV？
发生在哪里？
哪些人物参与？
哪些地点、势力、规则、道具、能力相关？
人物想要什么？
阻碍是什么？
人物采取了什么行动？
做出了什么选择？
产生了什么后果？
读者获得了什么？
打开或关闭了什么期待？
下一场必须承接什么？
```

### 3.3 Scene 不是什么

Scene 不是：

```txt
普通章节段落
正文字符串片段
自由 JSON 容器
完整记忆系统
连续性审稿系统
世界观实体
章节计划的复制品
```

Scene 本身只做结构锚点。正文、计划、摘要、交接都应拆出去。

---

## 4. 写作前的最低可写资产集

### 4.1 不强制填百科

工作台不应要求用户在写正文前填完：

```txt
所有人物
所有地点
所有势力
所有道具
所有规则
所有物种
所有时间线
```

这会让创作变成填表地狱。

但系统应提示“当前准备是否足够”，即：

```txt
写作准备度检查
```

准备度检查是软提醒，不是硬拦截。

### 4.2 写 Volume 前建议具备

写一个分卷 / 故事单元前，建议至少有：

```txt
主角
核心对立角色或势力
核心地点
关键世界规则
关键道具或能力
本卷核心冲突
本卷局部结局方向
本卷读者承诺
```

### 4.3 写 Chapter 前建议具备

写一章前，建议至少有：

```txt
本章目标
本章剧情功能
本章主要出场人物
本章主要地点
本章涉及势力
本章关键规则 / 道具 / 能力
上一章或上一场留下的期待
本章结尾要改变什么
```

### 4.4 写 Scene 前建议具备

写一个场景前，建议至少有：

```txt
POV 角色
参与人物
主地点
人物目标
人物行动
阻碍
选择
后果
读者奖励
上一场 SceneHandoff
```

缺少内容时，系统可以提示：

```txt
当前 Scene 缺少主要阻碍，剧情可能空转。
当前 Scene 缺少读者收获，章节体验可能偏弱。
当前 Scene 缺少承接项，可能和上一场断裂。
```

---

## 5. Volume / StoryUnit 的定位

### 5.1 Volume 不只是目录

当前项目已有 `Volume`。

设计上建议将它视为：

```txt
分卷 / 故事单元 / Arc
```

它不只是章节分组，而应承担阶段性故事闭环。

### 5.2 Volume 应表达什么

一个 Volume 应能描述：

```txt
本卷目标
本卷核心冲突
本卷主要人物变化
本卷主要地点范围
本卷相关势力
本卷关键规则
本卷关键道具 / 能力
本卷读者承诺
本卷局部答案
本卷结尾状态
本卷打开的新期待
```

### 5.3 当前阶段是否需要 VolumePlan

P1/P2 暂不新增 `VolumePlan`。

原因：

1. 当前重点是补 Scene 粒度。
2. `Volume` 已有 `summary`、`goal`、`status`。
3. 过早新增 `VolumePlan` 会扩大范围。

建议：

```txt
P1/P2：在设计文档中明确 Volume 的 StoryUnit 语义。
P3：如果需要更强分卷规划，再考虑 VolumePlan / StoryUnitPlan。
```

---

## 6. P1 核心实体总览

P1 只设计五个核心实体：

```txt
Scene
ScenePlan
SceneVersion
SceneSummary
SceneHandoff
```

关系：

```txt
Chapter
  -> Scene
      -> ScenePlan
      -> SceneVersion
      -> SceneSummary
      -> SceneHandoff
```

P1 不包含：

```txt
AI 生成
模型接入
复杂 UI
Beat
Scene 资产关系表
ChapterVersionSceneVersion
GenerationTask.sceneId
ContextSnapshot.sceneId
Memory 深度接入
```

P1 只提供 Scene profile 聚合读取和轻量 readiness 检查；不修改 `ContextSnapshot`，不扩展 `GenerationTask`，不接入 PromptRender 或模型调用。

---

## 7. Scene

### 7.1 职责

`Scene` 是章节内场景结构锚点。

它负责：

```txt
归属章节
章节内排序
场景标题
场景状态
叙事时间标签
主 POV
主地点
当前计划指针
当前正文版本指针
```

### 7.2 不负责

`Scene` 不负责：

```txt
不保存正文
不保存完整写作计划
不保存场景摘要
不保存场景交接
不保存全部参与人物
不保存全部相关地点/势力/规则
不承担 Memory / Continuity 审稿
```

### 7.3 推荐字段

| 字段 | 类型建议 | 说明 |
|---|---|---|
| `id` | String | 场景 ID |
| `projectId` | String | 所属小说项目 |
| `chapterId` | String | 所属章节，必填 |
| `title` | String? | 场景标题 |
| `goal` | String? | 场景目标简述 |
| `orderIndex` | Int | 章节内排序 |
| `status` | String | 写作流程状态，P1 不用 enum |
| `storyTimeLabel` | String? | 叙事时间标签 |
| `povCharacterId` | String? | 主 POV 角色 |
| `primaryLocationId` | String? | 主要地点 |
| `currentPlanId` | String? | 当前采用的 ScenePlan，P1 只保留字段 |
| `currentVersionId` | String? | 当前采用的 SceneVersion，P1 只保留字段 |
| `canonStatus` | CanonStatus | draft / confirmed / archived |
| `sourceType` | String? | 来源类型 |
| `sourceId` | String? | 来源 ID |
| `createdAt` | DateTime | 创建时间 |
| `updatedAt` | DateTime | 更新时间 |
| `deletedAt` | DateTime? | 软删除 |

### 7.3.1 P1 轻指针决策

P1 中以下字段只保留 ID，不建 Prisma relation：

```txt
povCharacterId
primaryLocationId
currentPlanId
currentVersionId
```

原因：

```txt
减少早期 schema 关系复杂度。
避免和 P2 的 SceneCharacter / SceneLocation 专用关系表语义混淆。
保持 currentPlanId/currentVersionId 与当前 Chapter.currentVersionId 的轻指针风格一致。
```

Service 层必须校验：

```txt
povCharacterId 指向的 Character 必须属于同一 project，且未软删除。
primaryLocationId 指向的 Location 必须属于同一 project，且未软删除。
currentPlanId 指向的 ScenePlan 必须属于同一 project / chapter / scene，且未软删除。
currentVersionId 指向的 SceneVersion 必须属于同一 project / chapter / scene，且未软删除。
```

profile API 需要手动聚合 POV Character 和 Primary Location。


### 7.4 status 词表

P1 使用 String + 文档词表：

```txt
planned
writing
reviewing
done
```

归档统一通过 `canonStatus = archived` 表达，避免 `status=archived` 与 `canonStatus=archived` 语义重叠。

注意区分：

```txt
status = 写作流程状态
canonStatus = 正史确认状态
```

---

## 8. ScenePlan

### 8.1 职责

`ScenePlan` 是场景写前计划。

它负责回答：

```txt
这个场景准备写什么？
人物在这里想要什么？
阻碍是什么？
人物会做什么选择？
这个选择会产生什么后果？
读者在这里获得什么？
本场会打开什么新期待？
```

### 8.2 不负责

`ScenePlan` 不负责：

```txt
不保存正文
不保存最终事实
不保存场景摘要
不保存 handoff
不替代 ChapterPlan
```

### 8.3 与 ChapterPlan 的关系

`ScenePlan` 应稳定归属 Chapter。

建议：

```txt
ScenePlan.chapterId 必填
ScenePlan.sceneId 必填
ScenePlan.chapterPlanId 可选
```

原因：当前 `ChapterPlan.chapterId` 可空，所以 `chapterPlanId` 不能作为唯一边界。

`chapterPlanId` 只表示：

```txt
这个 ScenePlan 来源于哪个 ChapterPlan
```

### 8.4 P1 字段收敛版

P1 不拆过细字段，使用收敛字段：

| 字段 | 类型建议 | 说明 |
|---|---|---|
| `id` | String | 场景计划 ID |
| `projectId` | String | 所属项目 |
| `chapterId` | String | 所属章节 |
| `sceneId` | String | 所属场景 |
| `chapterPlanId` | String? | 来源章节计划 |
| `title` | String? | 计划标题 |
| `goal` | String? | 场景目标 / 人物目标 |
| `outline` | String? | 场景概要 |
| `conflict` | String? | 阻碍 / 冲突 |
| `choice` | String? | 人物选择 |
| `consequence` | String? | 后果 |
| `readerPromise` | String? | 本场给读者的期待 |
| `readerPayoff` | String? | 本场兑现 / 读者收获 |
| `nextHook` | String? | 新期待 / 下一场钩子 |
| `constraints` | Json? | 非核心关系型约束 |
| `orderIndex` | Int | 计划版本排序 |
| `canonStatus` | CanonStatus | draft / confirmed / archived，用于控制是否进入上下文 |
| `sourceType` | String? | 来源类型 |
| `sourceId` | String? | 来源 ID |
| `createdAt` | DateTime | 创建时间 |
| `updatedAt` | DateTime | 更新时间 |
| `deletedAt` | DateTime? | 软删除 |

### 8.5 完整语义映射

P1 字段应覆盖完整语义：

```txt
goal              -> characterGoal / sceneGoal
outline           -> action / scene outline
conflict          -> obstacle
choice            -> character choice
consequence       -> result / state change
readerPromise     -> promise
readerPayoff      -> payoff
nextHook          -> nextExpectation
```

---

## 9. SceneVersion

### 9.1 职责

`SceneVersion` 是场景正文版本。

正文不能直接保存到 `Scene`。每次用户编辑、导入、后续 AI 生成结果，都应形成正文版本。

### 9.2 不负责

`SceneVersion` 不负责：

```txt
不保存计划
不保存摘要
不保存 handoff
不替代 ChapterVersion
不直接更新 Chapter 正文
```

### 9.3 推荐字段

| 字段 | 类型建议 | 说明 |
|---|---|---|
| `id` | String | 场景正文版本 ID |
| `projectId` | String | 所属项目，P1 冗余 |
| `chapterId` | String | 所属章节，P1 冗余 |
| `sceneId` | String | 所属场景 |
| `source` | String | user / imported / ai，内容来源粗分类 |
| `sourceType` | String? | 可追溯来源类型，例如 import / generationTask / split |
| `sourceId` | String? | 可追溯来源 ID |
| `content` | String | 场景正文 |
| `wordCount` | Int? | 字数 |
| `changeSummary` | String? | 变更说明 |
| `basedOnVersionId` | String? | 基于哪个版本修改 |
| `createdAt` | DateTime | 创建时间 |
| `updatedAt` | DateTime | 更新时间 |
| `deletedAt` | DateTime? | 软删除 |

### 9.4 生命周期与当前版本

P1 不给 `SceneVersion` 增加 `canonStatus`。当前采用的正文版本由 `Scene.currentVersionId` 表达。

正文版本允许软删除，但不能激活已软删除版本。删除不应物理移除正文版本，避免破坏版本追溯。

### 9.5 generationTaskId 是否 P1 加

P1 不加。

更稳的方式：

```txt
P1：SceneVersion 不依赖 GenerationTask。
P2：做 Scene 级生成时增加 generationTaskId。
```

---

## 10. SceneSummary

### 10.1 职责

`SceneSummary` 记录这个场景实际发生了什么。

它回答：

```txt
关键事件是什么？
人物状态发生了什么变化？
地点、势力、规则有没有变化？
新增了什么事实？
读者现在知道了什么？
```

### 10.2 不负责

`SceneSummary` 不负责：

```txt
不保存正文
不保存写前计划
不替代 SceneHandoff
不替代 ChapterSummary
不直接成为长期 MemoryRecord
```

注意：

```txt
SceneSummary 是记忆形成入口之一，但不是长期记忆本体。
```

### 10.3 推荐字段

| 字段 | 类型建议 | 说明 |
|---|---|---|
| `id` | String | 摘要 ID |
| `projectId` | String | 所属项目 |
| `chapterId` | String | 所属章节 |
| `sceneId` | String | 所属场景 |
| `sceneVersionId` | String? | 摘要来源正文版本 |
| `summary` | String | 场景摘要 |
| `keyEvents` | Json? | 关键事件 |
| `characterChanges` | Json? | 人物变化 |
| `locationChanges` | Json? | 地点变化 |
| `factionChanges` | Json? | 势力变化 |
| `worldRuleChanges` | Json? | 规则变化 |
| `newFacts` | Json? | 新事实 |
| `readerVisibleInfo` | Json? | 读者已见信息 |
| `canonStatus` | CanonStatus | draft / confirmed / archived，默认仅 confirmed 进入上下文 |
| `createdBy` | String? | user / system / ai |
| `sourceType` | String? | 来源类型 |
| `sourceId` | String? | 来源 ID |
| `createdAt` | DateTime | 创建时间 |
| `updatedAt` | DateTime | 更新时间 |
| `deletedAt` | DateTime? | 软删除 |

### 10.4 Json 边界

P1 使用 Json 对齐当前 `ChapterSummary` 风格。

但：

```txt
Json 只能保存摘要、提示、快照、自然语言结构。
不能用 Json 替代核心实体关系。
```

具体边界：

```txt
characterChanges 不能替代 CharacterState。
locationChanges 不能替代 LocationState。
factionChanges 不能替代 FactionState。
worldRuleChanges 不能替代 WorldRule 或专用规则关系。
newFacts 不能替代 Fact / MemoryRecord。
如果 Json 中引用实体，只能作为轻量 sourceRefs，不能作为正式关系来源。
```

---

## 11. SceneHandoff

### 11.1 职责

`SceneHandoff` 是场景后的下一场写作交接卡。

它面向下一场 Scene，而不是回顾当前场景。

它回答：

```txt
下一场写作前，必须记住什么？
读者已经知道什么？
世界实际变化了什么？
哪些问题还没回答？
哪些承诺打开了？
哪些承诺关闭了？
下一场必须承接什么？
有哪些风险？
```

### 11.2 不负责

`SceneHandoff` 不负责：

```txt
不保存正文
不替代摘要
不承担完整 Memory / Continuity 审稿
不作为 Relationship 的替代
不做全书伏笔系统
```

### 11.3 推荐字段

| 字段 | 类型建议 | 说明 |
|---|---|---|
| `id` | String | Handoff ID |
| `projectId` | String | 所属项目 |
| `chapterId` | String | 所属章节 |
| `sceneId` | String | 所属场景 |
| `sceneVersionId` | String? | 来源正文版本 |
| `nextSceneId` | String? | 目标下一场 |
| `readerKnows` | Json? | 读者已知信息 |
| `actualChanges` | Json? | 实际变化 |
| `openQuestions` | Json? | 未回答问题 |
| `promisesOpened` | Json? | 打开的期待/承诺 |
| `promisesClosed` | Json? | 关闭的期待/承诺 |
| `nextSceneMust` | Json? | 下一场必须承接 |
| `riskNotes` | Json? | 风险说明 |
| `canonStatus` | CanonStatus | draft / confirmed / archived，默认仅 confirmed 进入下一场上下文 |
| `createdBy` | String? | user / system / ai |
| `sourceType` | String? | 来源类型 |
| `sourceId` | String? | 来源 ID |
| `createdAt` | DateTime | 创建时间 |
| `updatedAt` | DateTime | 更新时间 |
| `deletedAt` | DateTime? | 软删除 |

### 11.4 nextSceneId 决策

P1 中 `nextSceneId` 只保留 ID，不建 Prisma relation。

允许 `nextSceneId` 指向同 project 下的任意 Scene，可以跨 Chapter。这样可以表达：

```txt
Chapter 1 最后一场的 handoff 指向 Chapter 2 第一场。
```

但这不代表 Scene 本身可以跨 Chapter。Scene 仍然必须归属自己的 Chapter。

Service 层必须校验：

```txt
nextSceneId 指向的 Scene 必须属于同一 project。
nextSceneId 指向的 Scene 不应是已软删除记录。
```

### 11.5 为什么独立

`SceneSummary` 回答：

```txt
这个场景发生了什么？
```

`SceneHandoff` 回答：

```txt
下一场必须继承什么？
```

语义不同，所以不建议把 Handoff 塞进 `SceneSummary`。

也不建议用 `Relationship` 替代。Handoff 是创作流程交接，不是普通实体关系。

---

## 12. Scene 与 Chapter 的关系

### 12.1 Scene 必须归属 Chapter

结论：

```txt
Scene.chapterId 必填
```

不允许一个 Scene 跨 Chapter。

原因：

1. Chapter 是当前正文结构的直接容器。
2. Scene 是章节内部的叙事颗粒度。
3. ChapterVersion 未来需要从 SceneVersion 装配。
4. Context Builder 需要按 Chapter 读取 Scene。
5. 跨 Chapter 会破坏排序、摘要、handoff 和版本装配。

### 12.2 跨 Chapter 连续场景怎么处理

如果一个事件跨章节，应拆成两个 Scene：

```txt
Chapter 10
  -> Scene A：追杀开始

Chapter 11
  -> Scene B：追杀继续
```

承接方式：

```txt
SceneHandoff.nextSceneMust
SceneHandoff.nextSceneId
Relationship: Scene continues Scene（后置）
```

P1 主要用 `SceneHandoff` 承接。

---

## 13. ScenePlan 与 ChapterPlan 的关系

### 13.1 ChapterPlan 是章节级计划

`ChapterPlan` 负责：

```txt
本章目标
本章大纲
本章 POV
本章约束
```

### 13.2 ScenePlan 是场景级计划

`ScenePlan` 负责：

```txt
本场人物目标
本场阻碍
本场选择
本场后果
本场读者承诺/兑现
```

### 13.3 关系

```txt
ChapterPlan
  -> ScenePlan[]
```

但 `ScenePlan.chapterPlanId` 可选。

因为有些 ScenePlan 可能由用户直接创建，不一定来自 ChapterPlan。

---

## 14. SceneVersion 与 ChapterVersion 的关系

### 14.1 P1 不强接

P1 中：

```txt
Scene -> SceneVersion
Chapter -> ChapterVersion
```

先不建立 `ChapterVersionSceneVersion`。

原因：当前 P1 不做整章装配。

### 14.2 P2 再补装配表

P2 可以新增：

```txt
ChapterVersionSceneVersion
```

用于记录：

```txt
某个 ChapterVersion 由哪些 SceneVersion 组成
```

字段建议：

```txt
chapterVersionId
sceneVersionId
sceneId
orderIndex
createdAt
```

用途：

```txt
追溯章节版本来源
支持场景重写后重新装配
保留历史章节版本不被污染
```

---

## 15. SceneSummary 与 ChapterSummary 的关系

### 15.1 SceneSummary 是输入

多个 `SceneSummary` 可以汇总成一个 `ChapterSummary`。

```txt
SceneSummary[]
  -> ChapterSummary
```

### 15.2 粒度差异

| 实体 | 粒度 | 用途 |
|---|---|---|
| SceneSummary | 单场景 | 下一场上下文、本章内部承接 |
| ChapterSummary | 整章 | 后续章节上下文、记忆沉淀入口 |

---

## 16. P2 关系实体

P1 暂不做场景资产关系表。P2 再做。

### 16.1 SceneCharacter

用于记录参与人物。

可能字段：

```txt
projectId
chapterId
sceneId
characterId
roleInScene
presence
goalInScene
stateBefore
stateAfter
knowledgeBefore
knowledgeAfter
emotionBefore
emotionAfter
orderIndex
notes
```

### 16.2 SceneLocation

用于记录多地点关系。

```txt
projectId
chapterId
sceneId
locationId
roleInScene
descriptionOverride
orderIndex
notes
```

### 16.3 SceneFaction

用于记录相关势力。

```txt
projectId
chapterId
sceneId
factionId
roleInScene
influence
readerVisible
orderIndex
notes
```

### 16.4 SceneWorldRule

用于记录相关世界规则。

```txt
projectId
chapterId
sceneId
worldRuleId
usageType
isCritical
readerVisible
notes
orderIndex
```

`usageType` 示例：

```txt
applies
revealed
violated
foreshadowed
exception
```

### 16.5 P2.5 / P3 可选关系

后续再考虑：

```txt
SceneStoryItem
SceneAbility
SceneSpecies
```

原因：这些也很重要，但 P1/P2 不宜一次性过重。

---

## 17. Relationship 的边界

已有 `Relationship` 不应成为万能垃圾桶。

适合 Relationship 的关系：

```txt
Scene continues Scene
Scene echoes Scene
Scene mentions Location
Scene reveals WorldRule
Scene foreshadows StoryItem
SceneVersion proves Relationship
```

不适合用 Relationship 代替：

```txt
Scene -> Chapter
Scene -> POV Character
Scene -> Primary Location
Scene -> ScenePlan
Scene -> SceneVersion
Scene -> SceneSummary
Scene -> SceneHandoff
```

原则：

```txt
高频主锚点：直接字段
场景核心参与关系：专用关系表
弱引用/证据/呼应：Relationship
```

---

## 18. Context Builder 读取策略

### 18.1 Scene 级上下文读取

写某个 Scene 时，Context Builder 应读取：

#### 叙事结构

```txt
Project
Volume
Chapter
Scene
```

#### 写作计划

```txt
Volume goal / summary
ChapterPlan
ScenePlan
```

#### 故事资产

P1：

```txt
POV Character
Primary Location
```

P2：

```txt
SceneCharacter
SceneLocation
SceneFaction
SceneWorldRule
```

P2.5/P3：

```txt
SceneStoryItem
SceneAbility
SceneSpecies
```

#### 连续性与体验

```txt
上一场 SceneSummary
上一场 SceneHandoff
本章前面已完成 SceneSummary
上一章 ChapterSummary
readerKnows
promisesOpened
nextSceneMust
riskNotes
```

### 18.2 不应读取

默认不应全量读取：

```txt
所有角色完整档案
所有地点
所有势力
所有世界规则
所有章节正文
所有历史摘要
所有 MemoryRecord
```

原则：

```txt
按当前场景任务读取
按相关资产读取
按当前分卷/章节边界读取
```

### 18.3 sourceRefs

`ContextSnapshot.sourceRefs` 必须记录来源。

示例：

```txt
Project
Volume
Chapter
ChapterPlan
Scene
ScenePlan
SceneVersion
SceneSummary
SceneHandoff
Character
Location
Faction
WorldRule
```

这样后续可以追溯：

```txt
模型为什么写出这段内容？
它参考了哪些实体？
```

---

## 19. GenerationTask / PromptRender 的关系

### 19.1 P1 不接生成链路

P1 不新增：

```txt
GenerationTask.sceneId
ContextSnapshot.sceneId
SceneVersion.generationTaskId
```

原因：当前不做 AI 生成，先把 Scene 结构打稳。

### 19.2 P2 再接

P2 做 Scene-aware generation 时再加：

```txt
GenerationTask.sceneId
ContextSnapshot.sceneId
SceneVersion.generationTaskId
```

并扩展 task type：

```txt
generateScene
rewriteScene
summarizeScene
planScene
```

---

## 20. 来源字段命名约定

为避免 `ai / AI / generationTask / generation_task` 等来源命名混乱，Scene 模块采用统一来源语义：

```txt
createdBy：创建者类别，例如 user / system / ai。
source：内容来源粗分类，仅用于 SceneVersion，例如 user / imported / ai。
sourceType/sourceId：可追溯来源链路，例如 generationTask/<id>、import/<id>、chapterSplit/<id>。
```

规则：

```txt
前端不得伪造跨项目 sourceId。
Service 层必须校验 sourceType/sourceId 的项目边界。
SceneVersion 虽然有 source 字段，也必须保留 sourceType/sourceId 以便未来追溯导入、拆分或生成来源。
```

---

## 21. API 设计草案

API 必须遵守 `docs/development/entity-api-principles.md`：

```txt
所有写接口必须校验 projectId 边界。
PATCH 只修改当前资源主体，不深改子实体。
DELETE 默认软删除，即设置 deletedAt。
普通 list 默认排除 deletedAt 非空记录。
activate / reorder / confirm / archive / restore 必须走专门 API。
不能激活已软删除、跨项目、跨 chapter 或跨 scene 的记录。
列表 API 需要支持分页和必要筛选。
```

常见错误应使用项目统一错误格式，至少覆盖：

```txt
NOT_FOUND
RELATION_NOT_FOUND
VALIDATION_ERROR
CONFLICT
STALE_WRITE
```

### 23.1 查询、生命周期与 PATCH 边界

Scene list 建议支持：

```txt
status
canonStatus
deleted
sourceType
limit
cursor 或 page/pageSize
orderBy=orderIndex/updatedAt
```

生命周期 API：

```txt
POST /projects/:projectId/scenes/:sceneId/confirm
POST /projects/:projectId/scenes/:sceneId/archive
POST /projects/:projectId/scenes/:sceneId/restore
```

PATCH 边界：

```txt
PATCH /scenes/:sceneId 只改 Scene 主体基础字段。
不通过 Scene PATCH 新建或删除 ScenePlan。
不通过 Scene PATCH 新建或删除 SceneVersion。
不通过 Scene PATCH 深改 SceneSummary / SceneHandoff。
currentPlanId / currentVersionId 只能通过 activate API 更新。
```

activate 校验：

```txt
currentPlanId 指向的 ScenePlan 必须属于同一 projectId / chapterId / sceneId。
currentVersionId 指向的 SceneVersion 必须属于同一 projectId / chapterId / sceneId。
不能激活已软删除记录。
不能激活跨项目记录。
```

### 23.2 Scene API

```txt
GET    /projects/:projectId/chapters/:chapterId/scenes
POST   /projects/:projectId/chapters/:chapterId/scenes
GET    /projects/:projectId/scenes/:sceneId
PATCH  /projects/:projectId/scenes/:sceneId
DELETE /projects/:projectId/scenes/:sceneId
POST   /projects/:projectId/chapters/:chapterId/scenes/reorder
GET    /projects/:projectId/scenes/:sceneId/profile
```

`profile` 聚合读取：

```txt
scene
currentPlan
currentVersion
latestSummary
latestHandoff
povCharacter
primaryLocation
readiness
```

### 23.3 ScenePlan API

```txt
GET    /projects/:projectId/scenes/:sceneId/plans
POST   /projects/:projectId/scenes/:sceneId/plans
GET    /projects/:projectId/scene-plans/:planId
PATCH  /projects/:projectId/scene-plans/:planId
DELETE /projects/:projectId/scene-plans/:planId
POST   /projects/:projectId/scenes/:sceneId/plans/:planId/activate
```

### 21.4 SceneVersion API

```txt
GET    /projects/:projectId/scenes/:sceneId/versions
POST   /projects/:projectId/scenes/:sceneId/versions
GET    /projects/:projectId/scene-versions/:versionId
PATCH  /projects/:projectId/scene-versions/:versionId
POST   /projects/:projectId/scenes/:sceneId/versions/:versionId/activate
```

### 21.5 SceneSummary API

```txt
GET    /projects/:projectId/scenes/:sceneId/summaries
POST   /projects/:projectId/scenes/:sceneId/summaries
GET    /projects/:projectId/scene-summaries/:summaryId
PATCH  /projects/:projectId/scene-summaries/:summaryId
DELETE /projects/:projectId/scene-summaries/:summaryId
```

### 21.6 SceneHandoff API

```txt
GET    /projects/:projectId/scenes/:sceneId/handoffs
POST   /projects/:projectId/scenes/:sceneId/handoffs
GET    /projects/:projectId/scene-handoffs/:handoffId
PATCH  /projects/:projectId/scene-handoffs/:handoffId
DELETE /projects/:projectId/scene-handoffs/:handoffId
```

---

## 22. UI 草案

P1 只做轻 UI。

### 23.1 章节内 Scene 列表

展示：

```txt
场景标题
状态
POV
主地点
叙事时间
字数
是否有 plan
是否有 summary
是否有 handoff
```

### 23.2 Scene 详情

简单分 Tab：

```txt
基础信息
写前计划
正文版本
场景摘要
场景交接
准备度检查
```

### 23.3 写作准备度检查

展示类似：

```txt
当前 Scene 准备度：

已具备：
- POV 角色
- 主地点
- 人物目标
- 阻碍

建议补充：
- 读者收获
- 下一场承接项
- 相关世界规则
```

这不是强制校验，只是辅助作者和后续 AI 上下文更稳定。

---

## 23. 分期规划

### 23.1 P1：Scene 基础结构线

目标：

```txt
建立章节内场景颗粒度
支持写前计划、正文版本、摘要、交接
```

包含：

```txt
Scene
ScenePlan
SceneVersion
SceneSummary
SceneHandoff
Scene profile
轻量 readiness 检查
基础 UI
基础 API
```

不包含：

```txt
AI 生成
模型接入
复杂 UI
Beat
Scene 资产关系表
ChapterVersionSceneVersion
GenerationTask.sceneId
ContextSnapshot.sceneId
Memory 深度接入
```

### 23.2 P2：关系与上下文深化

目标：

```txt
让 Scene 真正参与 Context Builder 和章节装配
```

包含：

```txt
SceneCharacter
SceneLocation
SceneFaction
SceneWorldRule
ChapterVersionSceneVersion
Scene-aware Context Builder
ContextSnapshot.sceneId
GenerationTask.sceneId
SceneVersion.generationTaskId
```

### 23.3 P2.5 / P3：高级能力

包含：

```txt
SceneStoryItem
SceneAbility
SceneSpecies
Beat
VolumePlan / StoryUnitPlan
Promise / Payoff 独立实体
PlotThread
Timeline
Continuity Review
Memory 深度接入
```

---

## 24. 核心原则

```txt
1. Scene 必须归属 Chapter。
2. Scene 是三条链交汇点，不是普通 CRUD 子表。
3. 写前计划、正文版本、摘要、交接必须分离。
4. P1 不做 AI 生成，不接模型。
5. 不用自由 JSON 替代核心实体关系。
6. SceneHandoff 独立存在。
7. Beat 后置。
8. Context Builder 读取结构化实体，不全量注入。
9. Volume 语义上承担故事单元职责。
10. 写作准备度提示，不做强制百科填表。
```

---

## 25. P1 schema 轻关系决策

P1 schema 采用“强归属关系建 relation，轻指针由 Service 校验”的策略。

### 25.1 强 relation

以下归属关系建议建 Prisma relation：

```txt
Scene -> Project / Chapter
ScenePlan -> Project / Chapter / Scene / ChapterPlan
SceneVersion -> Project / Chapter / Scene / basedOnVersion
SceneSummary -> Project / Chapter / Scene / SceneVersion
SceneHandoff -> Project / Chapter / Scene / SceneVersion
```

### 25.2 轻指针

以下字段 P1 只保留 ID，不建 Prisma relation：

```txt
Scene.povCharacterId
Scene.primaryLocationId
Scene.currentPlanId
Scene.currentVersionId
SceneHandoff.nextSceneId
```

Service 层负责一致性校验。

### 25.3 nextSceneId 跨章规则

`SceneHandoff.nextSceneId` 允许指向同 project 下的任意 Scene，包括下一章的 Scene。

这用于支持章节之间的场景交接：

```txt
上一章最后一场 -> 下一章第一场
```

但 Scene 本身仍然必须归属某个 Chapter，不允许一个 Scene 跨 Chapter。

### 25.4 SceneVersion.source

P1 中 `SceneVersion.source` 使用 String，不新增 enum。

词表：

```txt
user
imported
ai
```

同时保留 `sourceType/sourceId` 用于可追溯来源链路。

---

## 26. 已批准决策

| 问题 | 决策 |
|---|---|
| `Scene.status` | P1 使用 String + 文档词表，不包含 archived |
| `SceneVersion.projectId/chapterId` | P1 冗余 |
| `ScenePlan` 字段 | P1 收敛字段，保留完整语义 |
| `SceneSummary` | 对齐 ChapterSummary，用 Json |
| `SceneHandoff` | 固定七类字段，Json 类型 |
| `VolumePlan` | P1/P2 不做，先增强 Volume 语义 |
| `Scene profile` | P1 必做 |
| 准备度检查 | P1 做轻量 readiness |
| `currentPlanId/currentVersionId` | P1 只保留字段，不建 Prisma relation；通过 activate API 校验一致性 |
| P2 关系表 | 先做 SceneCharacter / SceneLocation / SceneFaction / SceneWorldRule |
| `povCharacterId/primaryLocationId` | P1 只保留 ID，不建 Prisma relation，Service 校验 project 边界 |
| `SceneHandoff.nextSceneId` | P1 只保留 ID，不建 Prisma relation，允许同 project 跨 Chapter |
| `SceneVersion.source` | P1 使用 String，不新增 enum |
