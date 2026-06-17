# OmniRadar — 全域视频下载 · AI文字稿 · 内容拆解

## 产品定位

面向中国出海品牌 / 自媒体团队的内容情报 SaaS。
核心功能：视频下载（22+平台）→ AI文字稿（Whisper）→ 内容结构分析。
品牌隶属 Omni 体系（与 OmniGTM 共用品牌伞）。

## 项目结构

```
项目-OmniRadar/
├── web/             — 官网落地页（纯静态 HTML，已部署 Cloudflare Pages）
├── feishu-plugin/   — 飞书 Base 侧边栏插件（Vite + React，已部署 GitHub Pages）
└── CLAUDE.md        — 本文件
```

## 线上地址

- 官网：https://omniradar.pages.dev（Cloudflare Pages）
- 飞书插件：https://geniusconnor.github.io/omniradar/（GitHub Pages，gh-pages 分支）
- GitHub：https://github.com/geniusconnor/omniradar

## 部署命令

更新官网：`wrangler pages deploy web/ --project-name omniradar`
更新插件：`cd feishu-plugin && npm run deploy`

## 域名（待注册）

- omniradar.io：$50/年（首选，等后端跑通后注册）
- omniradar.ai：$80/年，2年起（后续品牌升级）
- 注册在 Cloudflare Registrar（at-cost，无溢价）

## 飞书插件

- SDK：@lark-base-open/js-sdk ^1.0.2
- 端口：3100（npm run dev）
- 功能：内容拆解 / 竞品分析 / 文案优化 / 关键词提取
- AI：用户自填 Claude 或 DeepSeek API Key（存 localStorage）
- 飞书 CLI appId：cli_aab81d494eb8dce1

## 后端路线图（分层）

- 第1层：TikHub API → 22+平台视频解析 + 无水印下载
- 第2层：OpenAI Whisper → 音频转文字稿（$0.006/分钟）
- 第3层：Claude/DeepSeek → 内容结构分析
- 第4层：批量下载 + 封面拆解 + 竞品监控
- 服务器：chuhaiqu-prod-01（64.23.233.127，Python FastAPI）

## 技术规范

- 飞书插件：无 BrowserRouter，只用 Hash 路由；写回字段只用 FieldType.Text
- 本地预览端口：官网 8769，插件 3100
- API Key 统一存 ~/.claude/API_KEYS.md
