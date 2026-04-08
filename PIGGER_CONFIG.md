# Pigger 配置说明

这份文档用于说明 `pigger` 当前版本的主要配置方式、配置文件位置、加载顺序、兼容模式，以及常见配置示例。

说明基于当前项目实现整理，重点覆盖你实际会用到的配置，而不是单纯罗列源码里的所有内部字段。

## 1. 配置文件位置

### 1.1 默认路径

`pigger` 目前主要使用下面几类配置文件：

| 类型 | 默认路径 | 说明 |
| --- | --- | --- |
| 用户设置 | `~/.pigger/settings.json` | 全局用户级配置，最常用 |
| 项目设置 | `<项目根目录>/.pigger/settings.json` | 项目共享配置，适合提交到仓库 |
| 本地项目设置 | `<项目根目录>/.pigger/settings.local.json` | 仅本机生效，通常不提交，适合放密钥 |
| 全局行为配置 | `~/.pigger/.config.json` | UI、主题、通知、编辑器行为等全局状态 |
| 通过命令行注入 | `--settings <文件或JSON>` | 临时附加设置 |
| 企业/受管设置 | `managed-settings.json` 等 | 受管环境使用，普通本地用户通常不用 |

### 1.2 兼容模式相关路径

如果启用了兼容模式，还会读取这些旧配置：

| 模式 | 默认路径 | 说明 |
| --- | --- | --- |
| Claude 兼容 | `~/.claude/settings.json` | 旧版 Claude 用户设置 |
| Claude 兼容 | `~/.claude/settings.local.json` | 旧版 Claude 本地设置 |
| Claude 兼容 | `~/.claude.json` | 旧版 Claude 全局配置 |
| Codex 兼容 | `~/.codex/config.toml` | Codex 模型与 Provider 配置 |
| Codex 兼容 | `~/.codex/auth.json` | Codex API key / auth 信息 |

### 1.3 自定义配置目录

如果设置了下面的环境变量，`pigger` 的用户配置目录会改到新位置：

- `PIGGER_CONFIG_DIR`

例如：

```bash
export PIGGER_CONFIG_DIR="$HOME/.pigger-config"
```

此时用户设置通常会变成：

- `$PIGGER_CONFIG_DIR/settings.json`
- 全局配置文件会跟随这个目录变化

## 2. 配置加载顺序与覆盖规则

`pigger` 的设置是分层加载的。默认顺序如下：

1. `userSettings`
2. `projectSettings`
3. `localSettings`
4. `flagSettings`（`--settings`）
5. `policySettings`（受管/企业设置）

可以简单理解为：

- 越靠后的来源，优先级越高
- 标量字段通常是后者覆盖前者
- 一些数组字段会合并，而不是完全覆盖
- `policySettings` 一般优先级最高

### 2.1 推荐使用方式

建议这样分工：

- `~/.pigger/settings.json`
  - 放个人通用偏好
  - 比如语言、输出风格、默认模型来源
- `.pigger/settings.json`
  - 放项目共享设置
  - 比如默认 Provider 名称、公共 base URL、hooks、权限规则
- `.pigger/settings.local.json`
  - 放本机专属内容
  - 比如 `apiKey`、私有路径、只想自己生效的权限

### 2.2 全局配置与 settings 的区别

`~/.pigger/.config.json` 和 `settings.json` 不是一回事：

- `settings.json` 更偏“会话/模型/权限/Provider”
- `~/.pigger/.config.json` 更偏“界面行为/UI 状态/全局偏好”

例如：

- `openai`
- `permissions`
- `claudeCompatibility`
- `codexCompatibility`

通常放在 `settings.json`

而下面这些更常出现在 `~/.pigger/.config.json`：

- `theme`
- `verbose`
- `preferredNotifChannel`
- `editorMode`
- `diffTool`

## 3. 最小可用示例

最简单的用户配置文件：

路径：

`~/.pigger/settings.json`

```json
{
  "language": "chinese",
  "outputStyle": "default",
  "permissions": {
    "defaultMode": "acceptEdits"
  }
}
```

## 4. 常用 settings.json 配置项

下面按类别说明最常用的字段。

### 4.1 模型与 Provider

#### `model`

作用：

- 指定默认模型

示例：

```json
{
  "model": "claude-sonnet-4-6"
}
```

#### `openai`

作用：

- 配置一个 GPT/OpenAI 兼容 Provider
- 可用于 OpenAI 官方接口，也可用于 OpenRouter、One API、本地网关、自建中转

字段：

- `name`：Provider 显示名称
- `baseUrl`：API 基础地址
- `apiKey`：API key
- `model`：默认模型
- `models`：保存在 `/model` 菜单里的模型列表

示例：

```json
{
  "openai": {
    "name": "My Gateway",
    "baseUrl": "http://127.0.0.1:8317/v1",
    "model": "gpt-5.4",
    "models": [
      "gpt-5.4",
      "gpt-5.4-mini"
    ]
  }
}
```

如果你不想把 key 放进共享文件，推荐拆成：

`.pigger/settings.json`

```json
{
  "openai": {
    "name": "My Gateway",
    "baseUrl": "http://127.0.0.1:8317/v1",
    "model": "gpt-5.4",
    "models": [
      "gpt-5.4"
    ]
  }
}
```

`.pigger/settings.local.json`

```json
{
  "openai": {
    "apiKey": "your-api-key"
  }
}
```

### 4.2 Claude 兼容模式

#### `claudeCompatibility`

作用：

- 让 `pigger` 读取旧版 Claude 配置
- 当前实现会读取：
  - `~/.claude/settings.json`
  - `~/.claude/settings.local.json`
  - `~/.claude.json`

字段：

- `enabled`：是否启用
- `configDir`：可选，覆盖默认的 `~/.claude`

示例：

```json
{
  "claudeCompatibility": {
    "enabled": true
  }
}
```

自定义 Claude 配置目录：

```json
{
  "claudeCompatibility": {
    "enabled": true,
    "configDir": "/path/to/my-claude-config"
  }
}
```

启用后行为：

- `~/.claude/settings.json` 与 `~/.claude/settings.local.json` 会作为旧配置源导入
- 当前 `~/.pigger/settings.json` 仍然可以覆盖这些旧值
- 如果启用了 Claude 兼容，全局配置层还会参考 `~/.claude.json`

适合场景：

- 你本来就在用 Claude Code 的旧配置
- 想直接复用旧配置里的模型、权限、环境变量

### 4.3 Codex 兼容模式

#### `codexCompatibility`

作用：

- 让 `pigger` 读取 Codex CLI 配置
- 当前实现主要读取：
  - `~/.codex/config.toml`
  - `~/.codex/auth.json`

字段：

- `enabled`：是否启用
- `configDir`：可选，覆盖默认的 `~/.codex`

示例：

```json
{
  "codexCompatibility": {
    "enabled": true
  }
}
```

自定义 Codex 配置目录：

```json
{
  "codexCompatibility": {
    "enabled": true,
    "configDir": "/path/to/my-codex-config"
  }
}
```

启用后行为：

- 从 `config.toml` 读取模型、Provider、推理强度等信息
- 从 `auth.json` 读取 API key
- 当前项目里已经做了 GPT/Responses 兼容处理，适合接 GPT 类模型

适合场景：

- 你已经有可用的 Codex 配置
- 想让 `pigger` 直接复用 Codex 的模型与认证

### 4.4 三种模型来源切换

当前版本支持三种主要配置来源：

- `Built-in/current`
- `Claude`
- `Codex`

你可以通过 `/config` 里的 `Config source` 进行切换。

大致含义：

- `Built-in/current`
  - 使用 `pigger` 自己的当前配置
- `Claude`
  - 启用 `claudeCompatibility`
- `Codex`
  - 启用 `codexCompatibility`

一般建议不要手动同时开启两种兼容模式；实际使用中优先通过 `/config` 切换。

### 4.5 权限配置

#### `permissions`

作用：

- 控制工具权限
- 可以设置允许、拒绝、总是询问、默认权限模式等

常见字段：

- `allow`
- `deny`
- `ask`
- `defaultMode`
- `additionalDirectories`

常见 `defaultMode`：

- `default`
- `plan`
- `acceptEdits`
- 某些环境下还可能有 `auto`、`dontAsk`、`bypassPermissions`

示例：

```json
{
  "permissions": {
    "defaultMode": "acceptEdits",
    "allow": [
      "Bash(git:*)",
      "Read",
      "Edit"
    ],
    "deny": [
      "Bash(rm -rf:*)"
    ]
  }
}
```

如果你需要放宽目录范围：

```json
{
  "permissions": {
    "additionalDirectories": [
      "/data/projects",
      "/mnt/shared"
    ]
  }
}
```

### 4.6 环境变量注入

#### `env`

作用：

- 为 `pigger` 会话注入环境变量

示例：

```json
{
  "env": {
    "OPENAI_BASE_URL": "http://127.0.0.1:8317/v1",
    "OPENAI_API_KEY": "your-api-key",
    "OPENAI_MODEL": "gpt-5.4"
  }
}
```

说明：

- `OPENAI_API_KEY`
- `OPENAI_BASE_URL`
- `OPENAI_MODEL`

这些环境变量会直接影响 GPT/OpenAI Provider 的实际行为。

如果你同时配了 `openai` 和 `OPENAI_*`，通常要注意：

- `OPENAI_*` 更像运行时覆盖
- 文档和排错时要优先检查环境变量

### 4.7 输出与界面

#### `outputStyle`

作用：

- 控制回答输出风格

当前内置至少包含：

- `default`
- `Explanatory`
- `Learning`

示例：

```json
{
  "outputStyle": "default"
}
```

#### `language`

作用：

- 设置回答语言偏好

示例：

```json
{
  "language": "chinese"
}
```

#### 其他常见交互字段

- `alwaysThinkingEnabled`
- `effortLevel`
- `fastMode`
- `promptSuggestionEnabled`
- `prefersReducedMotion`
- `spinnerTipsEnabled`
- `syntaxHighlightingDisabled`
- `defaultView`

示例：

```json
{
  "alwaysThinkingEnabled": true,
  "effortLevel": "high",
  "fastMode": false,
  "promptSuggestionEnabled": true,
  "prefersReducedMotion": false
}
```

### 4.8 自动更新

#### `autoUpdatesChannel`

作用：

- 设置自动更新频道

可选值：

- `latest`
- `stable`

示例：

```json
{
  "autoUpdatesChannel": "latest"
}
```

#### `minimumVersion`

作用：

- 当切到稳定通道时，用来限制最低版本，避免被降级到过旧版本

示例：

```json
{
  "autoUpdatesChannel": "stable",
  "minimumVersion": "0.0.1"
}
```

### 4.9 Hooks、插件、MCP、工作树

这些属于进阶配置，常见字段包括：

- `hooks`
- `enabledPlugins`
- `extraKnownMarketplaces`
- `pluginConfigs`
- `enableAllProjectMcpServers`
- `enabledMcpjsonServers`
- `disabledMcpjsonServers`
- `allowedMcpServers`
- `deniedMcpServers`
- `worktree`

示例：

```json
{
  "worktree": {
    "symlinkDirectories": [
      "node_modules"
    ],
    "sparsePaths": [
      "src",
      "package.json"
    ]
  }
}
```

### 4.10 远程、SSH、记忆、计划

常见字段：

- `remote`
- `sshConfigs`
- `autoMemoryEnabled`
- `autoMemoryDirectory`
- `autoDreamEnabled`
- `plansDirectory`

SSH 示例：

```json
{
  "sshConfigs": [
    {
      "id": "prod",
      "name": "生产机",
      "sshHost": "user@example.com",
      "sshPort": 22,
      "startDirectory": "~/app"
    }
  ]
}
```

计划文件目录示例：

```json
{
  "plansDirectory": ".pigger/plans"
}
```

## 5. 常见的全局配置 `~/.pigger/.config.json`

这个文件更偏“本机 UI / 行为偏好”。

常见字段包括：

- `theme`
- `verbose`
- `preferredNotifChannel`
- `editorMode`
- `autoCompactEnabled`
- `showTurnDuration`
- `diffTool`
- `autoConnectIde`
- `autoInstallIdeExtension`
- `fileCheckpointingEnabled`
- `terminalProgressBarEnabled`
- `showStatusInTerminalTab`
- `respectGitignore`
- `copyFullResponse`
- `copyOnSelect`
- `remoteControlAtStartup`

示例：

```json
{
  "theme": "dark",
  "verbose": false,
  "preferredNotifChannel": "auto",
  "editorMode": "normal",
  "autoCompactEnabled": true,
  "showTurnDuration": true,
  "diffTool": "auto",
  "autoConnectIde": false,
  "autoInstallIdeExtension": true,
  "fileCheckpointingEnabled": true,
  "terminalProgressBarEnabled": true,
  "respectGitignore": true,
  "copyFullResponse": false
}
```

## 6. 常见场景示例

### 6.1 只使用 pigger 自己的当前配置

```json
{
  "claudeCompatibility": {
    "enabled": false
  },
  "codexCompatibility": {
    "enabled": false
  },
  "language": "chinese",
  "outputStyle": "default"
}
```

### 6.2 使用旧 Claude 配置

```json
{
  "claudeCompatibility": {
    "enabled": true
  },
  "codexCompatibility": {
    "enabled": false
  }
}
```

### 6.3 使用 Codex 配置

```json
{
  "claudeCompatibility": {
    "enabled": false
  },
  "codexCompatibility": {
    "enabled": true
  }
}
```

### 6.4 使用自定义 GPT/OpenAI 网关

```json
{
  "claudeCompatibility": {
    "enabled": false
  },
  "codexCompatibility": {
    "enabled": false
  },
  "openai": {
    "name": "Local Gateway",
    "baseUrl": "http://127.0.0.1:8317/v1",
    "model": "gpt-5.4",
    "models": [
      "gpt-5.4"
    ]
  }
}
```

配合本地 key：

```json
{
  "openai": {
    "apiKey": "your-api-key"
  }
}
```

## 7. 命令行与界面配合方式

### 7.1 `/config`

适合修改：

- `Config source`
- `language`
- `outputStyle`
- 权限默认模式
- 各类界面偏好

### 7.2 `/model`

适合管理：

- 当前模型
- GPT/OpenAI Provider
- 切回内置默认模型

### 7.3 `--settings`

适合临时附加配置：

```bash
pigger --settings ./my-settings.json
```

也可以直接传 JSON：

```bash
pigger --settings '{"language":"chinese","outputStyle":"default"}'
```

## 8. 排错建议

### 8.1 配了 `openai` 但没有生效

优先检查：

- 是否开启了 `claudeCompatibility`
- 是否开启了 `codexCompatibility`
- 是否设置了 `OPENAI_API_KEY`
- 是否设置了 `OPENAI_BASE_URL`
- 是否设置了 `OPENAI_MODEL`

如果你想完全回到当前配置，建议：

- 在 `/config` 里把 `Config source` 切回 `Pigger/current`
- 或手动把 `claudeCompatibility.enabled` 和 `codexCompatibility.enabled` 都改成 `false`

### 8.2 Claude 模式下为什么还会被当前配置覆盖

这是当前实现的设计：

- 旧 Claude 配置会被导入
- 但当前 `~/.pigger/settings.json` 仍然可以覆盖旧值

也就是说，Claude 兼容模式不是“完全锁死到旧配置”，而是“导入旧配置后，再允许当前配置覆盖”。

### 8.3 Codex 模式下读取哪些字段

当前实现主要关注：

- `config.toml` 里的模型与 Provider
- `auth.json` 里的认证信息

如果 Codex 模式不生效，优先检查：

- `~/.codex/config.toml` 是否存在
- `~/.codex/auth.json` 是否存在
- `model_provider` / `model` 是否填写
- 对应 Provider 的 `base_url` 是否存在

### 8.4 本地密钥应该放哪里

推荐放：

- `.pigger/settings.local.json`

而不是：

- `.pigger/settings.json`

这样更适合项目共享，也更安全。

## 9. 建议的目录布局

推荐把配置分成这样：

```text
~/.pigger/
  settings.json

~/.pigger/
  .config.json

your-project/
  .pigger/
    settings.json
    settings.local.json
```

推荐原则：

- 用户偏好放 `~/.pigger/settings.json`
- 项目共享规则放 `.pigger/settings.json`
- 私密信息放 `.pigger/settings.local.json`
- UI / 主题 / 通知放 `~/.pigger/.config.json`

## 10. 一份推荐的起步配置

`~/.pigger/settings.json`

```json
{
  "language": "chinese",
  "outputStyle": "default",
  "claudeCompatibility": {
    "enabled": false
  },
  "codexCompatibility": {
    "enabled": false
  },
  "permissions": {
    "defaultMode": "acceptEdits"
  }
}
```

如果你主要使用 GPT 网关，再补一个项目级配置：

`.pigger/settings.json`

```json
{
  "openai": {
    "name": "Local Gateway",
    "baseUrl": "http://127.0.0.1:8317/v1",
    "model": "gpt-5.4",
    "models": [
      "gpt-5.4"
    ]
  }
}
```

`.pigger/settings.local.json`

```json
{
  "openai": {
    "apiKey": "your-api-key"
  }
}
```

如果后面你想继续扩展，我建议下一步再单独补两份文档：

- `PIGGER_MODEL_GUIDE.md`
- `PIGGER_PERMISSION_GUIDE.md`

这样模型配置和权限规则会更容易查。
