# StoryItems 模块

`StoryItem` 已归入“能力与道具模块”。

详见：`docs/modules/abilities-and-items.md`。

## 当前定位

`StoryItem` 负责剧情道具、关键物品、遗物、装备、文书、载体等有剧情作用的物品。

它不负责普通杂物，也不承担技能/能力本体。

## 规则

1. 剧情道具作为一等实体，不再长期塞进 `WorldItem(type=item)`。
2. 道具规则通过 `StoryItemRule -> WorldRule` 表达。
3. 道具状态变化通过 `StoryItemState` 表达。
4. 道具与人物、地点、势力、物种的关系 P1 使用 `Relationship`。
5. 道具和技能在 UI 上可同属“能力与道具”模块，但数据层分开。
