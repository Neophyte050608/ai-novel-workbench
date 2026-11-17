# Semi Design MCP

项目已配置 Semi Design MCP：

- `.mcp.json`
- `.cursor/mcp.json`

配置内容：

```json
{
  "mcpServers": {
    "semi-design": {
      "command": "npx",
      "args": ["-y", "@douyinfe/semi-mcp"]
    }
  }
}
```

## 用途

后续 AI 开发 Semi UI 时，应优先查询 Semi MCP，确认组件 API、示例和最佳实践，避免凭记忆乱写组件属性。

## 备注

如果 MCP 客户端不自动读取项目级 `.mcp.json`，可以在客户端设置里手动添加同样的 `semi-design` server。
