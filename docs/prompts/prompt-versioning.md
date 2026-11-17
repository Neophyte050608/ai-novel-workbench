# Prompt 版本规范

Prompt 是产品资产，不允许散落在业务代码里。

## 命名

```txt
<domain>.<task>.v<major>.<minor>.<patch>
```

示例：

```txt
novel.generateChapter.v1.0.0
novel.continueChapter.v1.0.0
novel.rewriteChapter.v1.0.0
novel.polishChapter.v1.0.0
```

## 升级规则

| 变更类型 | 版本变化 |
|---|---|
| 修改措辞但不改变输入输出 | patch |
| 增加可选变量 | minor |
| 修改输出格式 | major |
| 删除变量 | major |
| 改变任务目标 | major |
