# UI 视觉与文案规范

## 页面结构

- 左侧使用固定导航，主内容区统一 `24px` padding。
- 页面顶部使用 `PageHeader`，左侧标题和描述，右侧放主要操作按钮。
- 卡片圆角统一 `12px`，内容块间距统一 `16px`。

## 按钮摆放

- 页面级主操作放在 `PageHeader.actions` 右侧，例如“创建项目”。
- 表格行内操作后续放在最右侧操作列。
- 不在列表卡片底部放临时提示或下一步开发说明。

## 文案

- UI 文案必须走 `apps/web/src/shared/i18n`。
- 不在组件里硬编码中文或英文。
- 开发提示、技术栈说明、AI 实现提示不放在正式 UI 里；这些内容放到 README 或 docs。

## Semi Design

开发 Semi 组件时优先查询 `semi-design` MCP。组件 API 不确定时，不要凭记忆写属性。

## 信息架构

UI 必须遵守 `docs/development/interaction-principles.md`。

核心规则：

- 书架层只放小说列表和新建入口。
- 项目内资源只在小说工作台层出现。
- 新建小说不能用 Modal 表单。
- 未实现功能不显示为可执行按钮。

