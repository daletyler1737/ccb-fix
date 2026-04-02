# ccb-fix - OpenClaw 一键修复工具

OpenClaw Gateway 修复工具，支持中英文界面，提供交互式菜单和一键修复功能。

## 功能

| 选项 | 功能 |
|------|------|
| 1 | 基础诊断 - 检查 Gateway、飞书、API Key、ccb-skills 状态 |
| 2 | 重启 Gateway |
| 3 | 修复飞书 - 补装缺失依赖并重启 |
| 4 | 屏蔽 Skills - 移走 ccb-* skills（可恢复）|
| 5 | API 问题排查 - 检查认证配置 |
| 6 | 升级/降级 OpenClaw |
| 7 | 完整恢复（推荐） - 备份+屏蔽ccb+修复飞书+重启 |
| 8 | 紧急模式 - 清理日志最小化启动 |
| 9 | OpenClaw 终端汉化对照表 |

## 安装

```bash
# 方式一：直接运行
node fix.js

# 方式二：加入 PATH
cp fix.js /usr/local/bin/ccb-fix
chmod +x /usr/local/bin/ccb-fix
ccb-fix

# 非交互式直接运行指定选项
ccb-fix 7     # 执行完整恢复
ccb-fix 4     # 屏蔽 ccb-skills
```

## 语言切换

运行后按 `L` 切换中英文，或：

```bash
node fix.js --lang en   # 英文
node fix.js --lang zh   # 中文
```

## 系统要求

- Node.js >= 16
- OpenClaw 已安装
- Linux/macOS

## MIT License
