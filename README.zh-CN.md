# pigger 2.1.88 恢复版

[English](./README.md) | 简体中文

这是一个根据 `cli.js.map` 重建出的 pigger 2.1.88 项目。仓库已经被重新整理为标准的 npm 项目结构，可以安装依赖、成功构建，并启动 CLI 入口。

## 项目概览

这个仓库的目标，是将 reverse-sourcemap 导出的结果整理成一个更适合实际开发的项目，便于：

- 使用 npm 安装依赖
- 在本地完成构建
- 直接从源码运行
- 持续修复和补全缺失部分

当前已经验证可正常工作的内容包括：

- `npm install`
- `npm run build`
- `node cli.js --help`
- `node dist/cli.js --help`
- `node dist/cli.js --version`

## 重要说明

这不是官方的上游源码仓库，而是一个基于 sourcemap 输出进行恢复和重建的项目。

由于 reverse-sourcemap 恢复本身并不完整，当前构建中包含了一些兼容层、生成的 shim，以及用于保证项目可安装、可构建的 stub 模块。实际含义是：

- 适合用于研究、调试和持续恢复工作
- 不保证与官方发布包的行为完全一致
- 某些私有集成、原生路径或高级功能仍可能需要手动补全

## 环境要求

- Node.js `>= 18`
- npm `>= 9`

建议先检查本地环境：

```bash
node -v
npm -v
```

## 快速开始

```bash
npm install
npm run build
node cli.js --help
node dist/cli.js --help
```

## 补充文档

- [PIGGER_CONFIG.md](./PIGGER_CONFIG.md)：配置文件位置、加载顺序、Claude/Codex/OpenAI 兼容配置说明
- [PIGGER_UI_GUIDE.md](./PIGGER_UI_GUIDE.md)：启动界面、输入框用法、`/` 命令总表

## 安装依赖

在项目根目录执行：

```bash
npm install
```

依赖解析和安装由 [package.json](./package.json) 与 `package-lock.json` 完成。

## 构建

使用以下命令构建项目：

```bash
npm run build
```

构建产物会输出到：

- `dist/cli.js`
- `dist/src/**`
- `dist/vendor/**`

构建流程定义在 [scripts/build.mjs](./scripts/build.mjs) 中，目前主要负责：

- 将仓库根目录下的 `src/`、`vendor/`、`__generated__/` 复制到 `dist/`
- 复制根目录入口 `cli.js` 与 `image-processor.js`
- 让 `dist/` 重新回到“构建输出目录”，不再兼作源码目录

## 运行

可直接从源码入口运行：

```bash
node cli.js --help
```

可直接运行构建后的 CLI：

```bash
node dist/cli.js --help
```

查看版本号：

```bash
node dist/cli.js --version
```

也可以通过 npm 运行：

```bash
npm start -- --help
```

## 作为本地 CLI 安装

构建完成后，如需将它安装为全局命令：

```bash
npm install -g .
```

然后执行：

```bash
pigger --help
```

本地开发也支持 `npm link`：

```bash
npm link
```

## 常用命令

```bash
npm install
npm run build
npm run clean
node cli.js --help
npm start -- --help
node dist/cli.js --version
```

## 项目结构

```text
.
├── package.json
├── package-lock.json
├── scripts/
│   └── build.mjs
├── src/
├── vendor/
└── dist/
```

说明：

- `src/`：当前 `pigger` 的主源码目录，后续开发应以这里为准
- `vendor/`：本地兼容实现与替代模块源码
- `__generated__/`：构建期常量与外部能力 shim
- `scripts/build.mjs`：将源码目录复制到 `dist/` 的构建脚本
- `dist/`：生成后的运行时输出，不再作为主源码目录

## 已知限制

- 某些原始依赖并不存在于 npm，目前只能用本地 shim 替代
- 某些模块无法从 sourcemap 中完整恢复，目前会在构建阶段以 stub 形式补齐
- “能够启动”并不等于“与官方 bundle 完全等价”
- 私有服务、私有协议以及某些原生平台路径，仍可能需要进一步补全

## 故障排查

如果你遇到构建或运行问题，建议按以下顺序排查：

1. 确认 Node.js 版本至少为 18。
2. 清理旧的构建产物。
3. 重新安装依赖。
4. 重新构建。
5. 验证基础 CLI 入口是否正常。

可用命令：

```bash
npm run clean
npm install
npm run build
node dist/cli.js --help
```

## 后续开发重点

如果你准备继续改进这个恢复版项目，通常优先级最高的方向包括：

- 修复启动阶段的运行时错误
- 用真实实现替换自动生成的 stub
- 为缺失的私有依赖行为补充兼容实现
- 将高价值命令与原始 bundle 的行为进行对照验证

## 许可证与来源说明

本仓库包含基于 sourcemap 输出重建得到的代码。在重新分发或公开发布之前，请务必检查原项目的许可证、版权及使用条款。
