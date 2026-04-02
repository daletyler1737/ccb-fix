---
name: ccb-fix
description: |
  OpenClaw one-click fix tool with bilingual Chinese/English / OpenClaw 一键修复工具
  Guided interactive menu for Gateway recovery, Feishu fix, Skills management, downgrade.
  用途：Gateway 故障、飞书异常、Skills 问题、降级系统、整体恢复的交互式修复工具。
  触发词 / Triggers: "gateway down", "飞书坏了", "skills报错", "system recovery",
  "can't connect", "fix openclaw", "系统修复", "一键修复"
---

# OpenClaw Fix Tool / OpenClaw 一键修复工具

Guided interactive menu for OpenClaw Gateway recovery and system maintenance.
OpenClaw Gateway 恢复和系统维护的交互式引导工具。

## 功能菜单 / Menu Options

| 选项 | 中文 | English |
|------|------|---------|
| 1 | 基础诊断 | Diagnostics - Gateway/飞书/API Key/错误日志 |
| 2 | 重启 Gateway | Restart Gateway (config unchanged) |
| 3 | 修复飞书 | Fix Feishu - install deps, restart |
| 4 | 屏蔽 Skills | Block Skills - isolate problematic skills |
| 5 | API 问题排查 | API Troubleshooting - auth config check |
| 6 | 升级/降级 | Upgrade/Downgrade OpenClaw |
| 7 | 完整恢复（推荐） | Full Recovery - backup+block+fix+restart |
| 8 | 紧急模式 | Emergency Mode - kill+clear+minimal start |
| 9 | 终端汉化 | OpenClaw CN - Chinese localization table |

## 详细说明 / Details

### 1. 基础诊断 / Diagnostics
- 检查 Gateway 运行状态（PID）/ Check Gateway status
- 检查 30988 端口 / Check port 30988
- 检查飞书插件状态 / Check Feishu plugin
- 检查 API Key 配置 / Check API Key config
- 检查 ccb-skills 数量 / Check ccb-skills count
- 查看最近错误日志 / Review recent error logs

### 2. 重启 Gateway / Restart Gateway
- 只重启服务，不修改配置 / Restart only, no config change

### 3. 修复飞书 / Fix Feishu
自动补装缺失依赖 / Auto-install missing deps:
- `@larksuiteoapi/node-sdk`
- `grammy`
- `@grammyjs/runner`
然后重启 Gateway 验证 / Then restart Gateway

### 4. 屏蔽 Skills / Block Skills
- 移走所有 ccb-* skills（带备份，可恢复）/ Move all ccb-* skills (backup, restorable)
- 单独屏蔽指定 skill / Block specific skill
- 恢复已屏蔽的 skills / Restore blocked skills

### 5. API 问题排查 / API Troubleshooting
- 检查 auth-profiles.json / Check auth-profiles.json
- 恢复备份认证 / Restore backup auth
- 从其他 agent 复制认证 / Copy auth from other agent

### 6. 升级/降级 / Upgrade/Downgrade
可选版本 / Available versions:
- 2026.3.13 (老稳定版 / Old stable)
- 2026.3.24 (较稳定 / Stable)
- 2026.3.28 (稳定 / More stable)
- 2026.3.31 (最新稳定 / Latest stable)

可选源 / Registry:
- 国际源 (npmjs.org)
- 中国源 (npmmirror)

### 7. 完整恢复 / Full Recovery
推荐的一键操作（推荐）/ Recommended one-click action:
1. 备份当前配置 / Backup current config
2. 移走所有 ccb-* skills / Move all ccb-* skills
3. 修复飞书配置 / Fix Feishu config
4. 优化 Gateway 配置 / Optimize Gateway config
5. 重启 Gateway / Restart Gateway

### 8. 紧急模式 / Emergency Mode
- 杀掉所有 Gateway 进程 / Kill all Gateway processes
- 清理所有日志 / Clear all logs
- 最小化启动 / Minimal start

### 9. 终端汉化 / OpenClaw CN
显示 openclaw 命令的英→中对照表 / English→Chinese mapping for openclaw commands:
```
help → 帮助, version → 版本, status → 状态,
start → 启动, stop → 停止, restart → 重启,
logs → 日志, config → 配置, skill → 技能,
session → 会话, task → 任务
```

## 执行方式 / Usage

```bash
# 交互式菜单 / Interactive menu
node fix.mjs

# 非交互式直接执行 / Non-interactive direct run
node fix.mjs --option 3          # 执行选项3 / Run option 3
node fix.mjs --option 7 --confirm  # 执行选项7，自动确认 / Run option 7, auto-confirm

# 切换语言 / Switch language
node fix.mjs --lang en   # 英文 / English
node fix.mjs --lang zh   # 中文 / Chinese

# 查看帮助 / Help
node fix.mjs --help
```

## 语言切换 / Language Switch

运行后按 `L` 键切换中英文，或使用 `--lang` 参数
Press `L` to toggle language, or use `--lang` parameter

## 系统要求 / Requirements

- Node.js >= 16
- Linux / macOS
- OpenClaw 已安装 / OpenClaw installed

## MIT License
