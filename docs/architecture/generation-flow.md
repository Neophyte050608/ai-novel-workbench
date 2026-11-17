# 生成链路

```txt
前端点击生成
  -> POST /generation-tasks
  -> 创建 GenerationTask
  -> Context Builder 创建 ContextSnapshot
  -> Prompts 模块渲染 Prompt
  -> LLM Provider 流式生成
  -> SSE 推送 delta
  -> 保存 ChapterVersion
  -> GenerationTask succeeded
```

## SSE 事件

- started
- context_ready
- delta
- message
- done
- error

## 原则

- 生成任务必须落库。
- SSE 中断不能丢失任务状态。
- 生成结果不得直接覆盖章节正文。
