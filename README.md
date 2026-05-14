# ACE-Lite

ACE-Lite 是一个面向 Windows 的本地桌面工具，用于观察并调整部分进程的系统资源调度策略。项目基于 React、TypeScript、Vite、Tauri 2 和 Rust 构建。

> 本项目仅用于本地系统资源调度研究与个人使用场景。使用者需要自行确认相关游戏、平台或软件的用户协议要求，并自行承担使用风险。

## 功能特性

- 运行时进程限制：
  - 降低进程优先级。
  - 设置 CPU 亲和性。
  - 尝试启用 Windows 效率模式 / 电源节流。
  - 尝试降低进程 I/O 优先级。
  - 尝试降低进程内存页优先级。
- 运行时状态反查：
  - 进程优先级。
  - CPU 亲和性。
  - I/O 优先级。
  - 内存页优先级。
  - 效率模式状态。
- 启动前策略：
  - 通过 Windows IFEO `PerfOptions` 写入部分进程的启动前优先级策略。
  - 支持 CPU 优先级、I/O 优先级和 Page 优先级配置。
- 资源观察：
  - 展示目标进程的 CPU、内存和磁盘 I/O 变化。
  - 支持导出日志和性能报告。
- 桌面体验：
  - Tauri 2 桌面应用。
  - 自绘窗口标题栏。
  - 托盘菜单。

## 安全边界

ACE-Lite 只使用本地 Windows 系统能力做资源调度，不包含以下行为：

- 不读写游戏内存。
- 不注入 DLL。
- 不 Hook 游戏函数。
- 不修改游戏文件。
- 不内置驱动或内核组件。

部分运行时限制需要管理员权限。某些受保护进程可能拒绝 I/O、内存页或效率模式等运行时控制，此时属于系统或目标进程的访问控制结果。

## 系统要求

- Windows 10 / Windows 11。
- WebView2 Runtime。
- Node.js 和 npm。
- Rust 工具链。
- 构建安装包时需要 Tauri 相关打包工具；Tauri CLI 通常会自动处理 WiX / NSIS 依赖。

## 开发环境

安装依赖：

```cmd
npm install
```

启动前端开发服务器：

```cmd
npm run dev
```

启动完整 Tauri 开发模式：

```cmd
npm run tauri dev
```

如果当前终端找不到 Rust 工具链，可以临时注入 Cargo 路径：

```cmd
set "PATH=%USERPROFILE%\.cargo\bin;%PATH%" && npm run tauri dev
```

## 构建

构建前端：

```cmd
npm run build
```

构建 Windows 桌面应用和安装包：

```cmd
set "PATH=%USERPROFILE%\.cargo\bin;%PATH%" && npm run tauri build
```

常见输出位置：

- `src-tauri/target/release/ace-lite.exe`
- `src-tauri/target/release/bundle/msi/`
- `src-tauri/target/release/bundle/nsis/`

## 项目结构

```text
ACE-Lite/
├─ src/                  # React 前端源码
├─ src-tauri/            # Tauri / Rust 后端源码
├─ public/               # 前端静态资源
├─ scripts/              # 辅助脚本
├─ package.json          # npm 依赖和脚本
└─ vite.config.ts        # Vite 配置
```

## 许可证

本项目使用 GNU General Public License v3.0。详见 [LICENSE](LICENSE)。

本项目包含对 GPL-3.0 项目 [FuckACE](https://github.com/shshouse/FuckACE) 相关实现的复制或改写，因此本项目整体按 GPL-3.0 方式开源发布。分发本项目或其修改版本时，应同时提供相应源代码，并遵守 GPL-3.0 的版权声明、许可证文本保留和再分发要求。

## 致谢

本项目在部分 Windows 进程调度能力的实现方式上参考了公开资料和开源项目的用户态实现思路，包括 [System Informer](https://github.com/winsiderss/systeminformer) 和 [FuckACE](https://github.com/shshouse/FuckACE)。System Informer 使用 MIT License；FuckACE 使用 GPL-3.0 license。相关第三方项目版权归其原作者所有。

## 免责声明

本项目按“原样”提供，不提供任何明示或暗示担保。使用本项目调整系统或进程资源分配可能导致软件行为变化，也可能违反部分软件或游戏平台的用户协议。使用者应自行判断适用性并承担全部风险。
