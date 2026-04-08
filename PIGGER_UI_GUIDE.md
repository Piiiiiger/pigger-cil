# Pigger UI 与 `/` 命令说明

这份文档专门说明两件事：

- `pigger` 启动后的界面怎么看
- 输入框里 `/` 命令怎么用、每条命令是干什么的

如果你想看配置文件、兼容 Claude/Codex/OpenAI 的配置方式，请配合查看 `PIGGER_CONFIG.md`。

说明基于你当前这份项目构建整理，重点讲实际会遇到的 UI 和当前注册出来的 `/` 命令。

## 1. 启动后的 UI 怎么看

你启动 `pigger` 后，首页大致可以分成 4 个区域。

### 1.1 顶部标题栏

最上面会显示类似：

```text
pigger v0.0.1
```

这里表示当前启动页标题和版本号。

### 1.2 左侧主卡片

左边通常会显示：

- 欢迎语，例如 `欢迎回来！`
- 一张 ASCII 图
- 当前正在使用的 Provider / 模型
- 当前计费或账号模式
- 当前工作目录

例如你截图里这一行：

```text
Codex/gpt-5.4 · API Usage Billing
~/Downloads/package
```

可以理解成：

- `Codex/gpt-5.4`：当前会话实际选中的模型来源与模型名
- `API Usage Billing`：当前走 API 计费模式
- `~/Downloads/package`：你现在操作的项目目录

这块主要是“当前会话摘要”，不是配置入口本身。

### 1.3 右侧信息卡片

右侧一般会显示两类信息：

- `Tips for getting started`
  - 新用户或新项目的提示
  - 常见会提示你执行 `/init` 等初始化命令
- `Recent activity`
  - 最近会话或最近项目活动
  - 如果没有历史，会显示 `No recent activity`

如果后续有版本更新，也可能看到 `What's new` 一类的信息。

### 1.4 底部输入区

最下面是你真正和 `pigger` 交互的地方，也就是提示词输入框。

这里通常会出现几类提示：

- `? for shortcuts`
  - 输入 `?` 或查看快捷键提示
- 任务状态
  - 如果有后台任务，会显示任务入口
- 当前模式提示
  - 比如普通模式、Vim 模式、权限模式等

你平时最常操作的其实就是这里。

## 2. 输入框怎么用

输入框不仅能直接聊天，还支持几种很关键的前缀语法。

| 输入方式 | 作用 |
| --- | --- |
| 直接输入文字 | 正常对话，让 `pigger` 分析、改代码、回答问题 |
| `/` | 打开命令菜单，执行内置命令 |
| `!` | 进入 bash 模式，直接执行 shell 命令 |
| `@` | 引用文件路径 |
| `&` | 作为后台任务运行 |
| `/btw` | 问一个“顺手插一句”的侧边问题，不打断主线 |

### 2.1 多行输入

当前实现支持两种常见方式：

- `Shift + Enter`
- `\` + `Enter`

如果你的终端还没有正确支持 `Shift + Enter`，可以执行：

```text
/terminal-setup
```

它会帮你安装换行相关的按键绑定。

### 2.2 清空当前输入

如果你只是想把输入框里还没发出的内容清掉，不是清会话，而是清“当前草稿”，可以：

- 连按两次 `Esc`

### 2.3 常见快捷键提示

输入区底部的 `? for shortcuts` 主要是告诉你还有一组快捷键帮助。当前代码里能看到的常见快捷操作包括：

- 切换 verbose/transcript 输出
- 切换任务视图
- 撤销
- 暂存当前 prompt
- 切换模型
- 在 `$EDITOR` 里编辑输入
- 粘贴图片

注意：

- 快捷键显示会受终端环境影响
- 实际按键以界面里显示出来的那一份为准

## 3. `/` 命令怎么用

### 3.1 打开方式

在输入框输入：

```text
/
```

就会弹出命令列表。

### 3.2 选择方式

常见用法是：

1. 先输入 `/`
2. 再继续输入几个字母过滤命令
3. 用方向键选择
4. 回车执行

例如：

```text
/mod
```

通常就能快速定位到 `/model`。

### 3.3 参数怎么传

有些命令后面可以直接跟参数，例如：

```text
/add-dir ~/code/demo
/color blue
/effort high
/resume bugfix
```

### 3.4 别名

有些命令有别名。例如：

- `/clear` 也可以用 `/reset`、`/new`
- `/resume` 也可以用 `/continue`
- `/branch` 也可以用 `/fork`

## 4. 最常用的几个入口

如果你刚开始用，最有价值的通常是下面这些：

- `/config`
  - 打开总设置面板
  - 适合改语言、主题、权限、编辑模式等
- `/model`
  - 管理模型来源、Provider、GPT/OpenAI/Codex 配置和默认模型
  - 如果你要切换 Claude、Codex、OpenAI 兼容配置，优先看这个
- `/status`
  - 查看当前版本、模型、账号/API 状态、工具状态
- `/clear`
  - 清空当前会话历史
- `/compact`
  - 压缩会话历史，但保留摘要
- `/resume`
  - 恢复以前的会话
- `/diff`
  - 看未提交代码改动
- `/doctor`
  - 检查安装和配置是否正常

## 5. 当前版本的 `/` 命令总表

下面按用途分组说明。命令名使用当前程序里的实际注册名称。

### 5.1 会话与上下文

- `/btw <question>`：提一个侧边小问题，不打断主会话。
- `/branch [name]`：从当前对话分叉出一个新分支会话。别名：`/fork`。
- `/clear`：清空当前会话历史并释放上下文。别名：`/reset`、`/new`。
- `/compact [可选摘要指令]`：压缩会话历史，但保留一份摘要继续放在上下文里。
- `/context`：查看当前上下文使用情况。
- `/copy`：复制最近一条回复到剪贴板。
- `/export [filename]`：把当前会话导出到文件或剪贴板。
- `/rename [name]`：重命名当前会话。
- `/resume [会话 ID 或关键词]`：恢复之前的会话。别名：`/continue`。
- `/rewind`：把代码和/或会话回退到之前的某个点。别名：`/checkpoint`。

### 5.2 模型、配置与界面

- `/config`：打开配置面板。别名：`/settings`。
- `/model [info|help|default]`：管理模型来源、GPT/OpenAI/Codex 配置和模型选择。
- `/effort [low|medium|high|max|auto]`：设置模型推理力度。
- `/permissions`：管理工具允许/拒绝规则。别名：`/allowed-tools`。
- `/sandbox`：查看或配置沙箱规则。
- `/theme`：切换主题。
- `/color <color|default>`：设置当前会话输入栏颜色。
- `/vim`：切换 Vim 编辑模式和普通编辑模式。
- `/statusline`：设置 `pigger` 的状态栏 UI。
- `/terminal-setup`：安装 `Shift + Enter` 换行相关按键支持。
- `/output-style`：旧命令，已废弃；现在建议改用 `/config`。

### 5.3 工作目录、代码与项目操作

- `/add-dir <path>`：添加一个新的工作目录。
- `/diff`：查看未提交修改和按轮次记录的 diff。
- `/init`：为当前项目初始化一个 `PIGGER.md` 代码库说明文件。旧的 `CLAUDE.md` 仍可兼容读取。
- `/memory`：编辑 `pigger` 的记忆文件。默认文件名是 `PIGGER.md` / `PIGGER.local.md`，旧的 `CLAUDE.md` 体系仍可兼容读取。
- `/pr-comments`：获取 GitHub Pull Request 的评论。
- `/review`：对 Pull Request 做 review。
- `/security-review`：对当前分支待提交修改做安全审查。

### 5.4 插件、扩展与集成

- `/agents`：管理 agent 配置。
- `/hooks`：查看工具事件的 hook 配置。
- `/ide [open]`：管理 IDE 集成并查看状态。
- `/mcp [enable|disable [server-name]]`：管理 MCP 服务器。
- `/plan [open|<description>]`：开启 plan 模式或查看当前计划。
- `/plugin`：管理 `pigger` 插件。别名：`/plugins`、`/marketplace`。
- `/reload-plugins`：在当前会话里重新加载插件改动。
- `/skills`：列出当前可用 skills。
- `/tasks`：查看和管理后台任务。别名：`/bashes`。

### 5.5 状态、诊断与统计

- `/cost`：查看当前会话累计成本和持续时间。
- `/doctor`：诊断当前 `pigger` 安装和设置是否正常。
- `/help`：查看帮助和可用命令。
- `/insights`：生成一份 `pigger` 会话分析报告。
- `/stats`：查看使用统计和活动情况。
- `/status`：查看版本、模型、账号/API 连通性和工具状态。
- `/release-notes`：查看版本更新说明。

### 5.6 反馈、分享与其它杂项

- `/exit`：退出当前 REPL。别名：`/quit`。
- `/feedback [report]`：提交反馈。别名：`/bug`。
- `/heapdump`：把 JS heap dump 到 `~/Desktop`，主要用于排查问题。
- `/mobile`：显示下载 Claude 手机 App 的二维码。别名：`/ios`、`/android`。这里也仍沿用上游文案。
- `/passes`：分享一周免费 `pigger` 使用资格给朋友。
- `/stickers`：贴纸相关入口。

## 6. 你可以这样理解 `/config` 和 `/model`

很多人刚开始最容易混淆这两个：

- `/config`
  - 更像“全局设置面板”
  - 适合改语言、主题、编辑器行为、权限策略、界面风格
- `/model`
  - 更像“模型与 Provider 面板”
  - 适合切换 Claude / Codex / GPT(OpenAI 兼容) 来源
  - 适合配置默认模型、模型列表、API Provider

如果你的问题是“我应该在哪切模型、切 Provider、改 API 配置”，优先去 `/model`。

如果你的问题是“我应该在哪改界面、行为、权限、主题”，优先去 `/config`。

## 7. 对你最实用的一套上手顺序

建议你第一次使用时按这个顺序来：

1. 先执行 `/status`，确认当前模型和 API 状态是通的。
2. 再执行 `/model`，确认你要用的是 Claude、Codex 还是 GPT/OpenAI 兼容配置。
3. 需要改界面和行为时，执行 `/config`。
4. 在项目目录里执行 `/init`，生成项目说明文件。
5. 开始正常对话；需要命令时输入 `/`，需要 shell 时输入 `!`。

## 8. 一句话速记

可以把 `pigger` 的使用逻辑记成：

- 聊天就直接输入
- 执行内置功能就输入 `/`
- 执行 shell 就输入 `!`
- 引用文件就输入 `@`
- 开后台任务就输入 `&`

如果后面你愿意，我还可以继续补一份“`/config` 每个选项分别是什么意思”的中文文档，专门把设置面板里的各个字段逐项讲清楚。
