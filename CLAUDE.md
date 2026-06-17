# OmniIntel — 内容情报 SaaS

## 产品定位

面向中国出海品牌/电商团队的 AI 内容情报工具。
阶段一：飞书 Base 侧边栏插件；阶段二：独立 Web SaaS。

## 项目结构

```
项目-OmniIntel/
├── feishu-plugin/   — Phase 1，飞书 Base 侧边栏插件（Vite + React）
└── web-saas/        — Phase 2，独立 Web SaaS（Supabase + Stripe + CF R2）
```

## 飞书插件开发

- 端口：3100（`npm run dev`）
- SDK：`@lark-base-open/js-sdk`（读写 Base 表格字段）
- 本地调试：需在飞书多维表格「开发者工具」注册 localhost:3100
- 构建：`npm run build` → `dist/`，用相对路径（base: './'）
- 发布：GitHub repo + `"output": "dist"` → 飞书插件市场审核表单

## 飞书 CLI 鉴权

- appId: `cli_aab81d494eb8dce1`
- 认证时间：2026-06-16

## 技术规范

- 无 BrowserRouter，只用 HashRouter（飞书插件限制）
- 写回字段只用 FieldType.Text（其他类型需单独处理）
- API Key 存 `~/.claude/API_KEYS.md`

## 域名（暂未注册）

推荐：omniintel.ai（$80/年，2年起）或 omniintel.io（$50/年）
等插件跑通后再注册。
