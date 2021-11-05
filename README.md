# `xhh`脚手架

一个集成了项目创建、`git flow`、发布为一体的工程化解决方案，提供了高度的拓展性。

## 使用说明

```bash
npm install -g @xhh-cli-dev/cli
```

目前以提供命令如下：

- `xhh init` 提供初始化项目功能
- `xhh kill <port>` 提供根据端口号删掉进程功能

> 有些小伙伴可能对`shell`命令不太熟，在开发过程中经常会遇到在启动项目时端口已经被占用问题，此处对`kill-port`包进行了包装，提供了快速关闭端口号对应进程命令。

- `xhh publish` 提供`git flow`功能
