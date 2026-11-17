# Prompts 模块

## 职责

管理 Prompt 模板、版本和最终渲染结果。

## 核心实体

- PromptTemplate
- PromptVersion
- PromptRender

## 渲染链路

```txt
PromptTemplate
  -> PromptVersion
  -> ContextSnapshot + variables
  -> PromptRender
  -> GenerationTask
```

## 规则

1. Prompt 不允许散落在业务代码中。
2. 每个 GenerationTask 必须绑定 PromptVersion。
3. 每个真正发给模型的 Prompt 必须记录 PromptRender。
4. PromptRender 记录 renderedSystem、renderedUser、variables 和 hash。
5. Prompt 输出格式变化必须升级 major 版本。
