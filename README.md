# pigger

`pigger` 是一个独立整理后的 CLI 项目，当前已经具备完整的 npm 工程结构，可以直接安装依赖、构建、运行，并作为全局命令使用。

这个仓库的目标不是保留一个“只能在当前机器上勉强跑起来”的目录，而是提供一份适合继续开发、上传 GitHub、再分发的源码仓库。

## 当前状态

当前已经验证通过：

- `npm install`
- `npm audit`
- `npm run build`
- `node cli.js --version`
- `node dist/cli.js --version`
- `pigger --version`

## 环境要求

- Node.js `>= 18`
- npm `>= 9`

建议先检查：

```bash
node -v
npm -v
```

## 快速开始

```bash
npm install
npm run build
node cli.js
```

如果你想在任意目录直接使用：

```bash
npm link
pigger
```

## 常用命令

```bash
npm install
npm audit
npm run build
npm run clean
node cli.js
node cli.js --version
node dist/cli.js --version
```

## 目录说明

```text
.
├── cli.js
├── image-processor.js
├── package.json
├── package-lock.json
├── scripts/
├── src/
├── vendor/
├── __generated__/
└── dist/
```

- `src/`：主源码目录，后续功能修改主要都在这里进行
- `scripts/`：构建脚本
- `vendor/`：兼容层和本地替代实现
- `__generated__/`：构建和运行依赖的生成文件
- `dist/`：构建产物，不建议手改，也不会提交到 GitHub

## GitHub 提交建议

仓库已经补了 `.gitignore`，默认不会提交这些本地内容：

- `node_modules/`
- `dist/`
- `.codex`
- `.wepscli/`
- `.pigger/`
- `.claude/`
- `.env*`
- `auth.json`
- `config.toml`
- 日志和临时文件

这意味着你上传到 GitHub 时，主要保留的是源码、构建脚本、文档和 `package.json` / `package-lock.json`。

## 配置与补充文档

- [PIGGER_CONFIG.md](./PIGGER_CONFIG.md)：配置文件路径、加载顺序、Claude/Codex/OpenAI 兼容说明
- [PIGGER_UI_GUIDE.md](./PIGGER_UI_GUIDE.md)：UI 界面和 `/` 命令说明
- [PIGGER_DOCS_MAP.md](./PIGGER_DOCS_MAP.md)：文档索引
- [README.zh-CN.md](./README.zh-CN.md)：之前整理的中文说明版本

## 上传到 GitHub

初始化并提交：

```bash
git init
git add .
git commit -m "init: independent pigger source"
```

关联远程仓库后推送：

```bash
git remote add origin <你的仓库地址>
git branch -M main
git push -u origin main
```

## 说明

这套代码目前是可安装、可构建、可运行、可继续维护的独立源码仓库。  
如果后面你还想继续整理发布，我建议下一步补三样东西：

- `LICENSE`
- GitHub Actions 构建工作流
- 更完整的发行说明和更新日志
