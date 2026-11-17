# SSE 模块

## 职责

将生成过程中的事件单向推送给前端。

## 事件类型

- started
- context_ready
- prompt_rendered
- delta
- message
- version_created
- done
- error

## 规则

1. SSE 不承担业务状态。
2. 任务状态必须落库在 GenerationTask。
3. 重要事件必须落库在 GenerationEvent。
4. SSE 中断后，前端必须能通过 taskId 查询结果。
