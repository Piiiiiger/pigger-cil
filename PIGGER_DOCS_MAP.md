# Pigger Docs Map

这份索引用来说明 `pigger` 当前内置文档各自负责什么内容。

## 优先阅读顺序

1. `README.zh-CN.md`
   - 中文总览
   - 安装、启动、基本使用
   - 适合第一次上手

2. `PIGGER_CONFIG.md`
   - 配置目录
   - Claude / Codex / OpenAI 兼容配置
   - 模型来源和配置文件格式

3. `PIGGER_UI_GUIDE.md`
   - 首页 UI 说明
   - `/` 命令说明
   - `/config`、`/model`、`/statusline` 等入口说明

4. `README.md`
   - 英文版总览
   - 适合和上游英文资料对照时查看

## 代码相关入口

- `src/`
  - 当前主要源码目录
- `cli.js`
  - 本地开发入口
- `scripts/build.mjs`
  - 构建脚本
- `package.json`
  - 包名、脚本、全局命令入口配置

## 兼容说明

- `pigger` 现在是独立 CLI。
- 默认主配置目录是 `~/.pigger`。
- `~/.claude` 与 `~/.codex` 仍然只作为兼容读取来源存在。
- `PIGGER.md` / `PIGGER.local.md` 是默认记忆文件名。
- `CLAUDE.md` / `CLAUDE.local.md` 仍然保留为兼容回退文件名。
