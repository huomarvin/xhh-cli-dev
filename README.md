# `xhh`脚手架

一个集成了项目创建、`git flow`、发布为一体的工程化解决方案，提供了高度的拓展性。



## 使用说明

```bash
npm install -g @xhh-cli-dev/cli
```

目前以提供命令如下：

### `xhh init`

- 根据模板提供初始化项目命令
- 根据模板提供初始化组件命令
  
  > 目前已提供模板信息可以参考如下接口 https://openapi.logrolling.cn/staging/project

### `xhh kill <port>` 关掉对应端口号所对应的进程

有些小伙伴可能对`shell`命令不太熟，在开发过程中经常会遇到在启动项目时端口已经被占用问题，此处对`kill-port`包进行了包装，提供了快速关闭端口号对应进程命令。



## 如何去自定义开发一个命令

### 创建目录

- 保证全局安装了`lerna`, 使用`lerna` 命令去创建一个 command 的命令包，可以参考下面

```bash
lerna create @xhh-cli-dev/publish
```

此时会在`packages`目录下创建一个文件夹为`publish`，将`publish`目录移动到`commands`目录下。

调整`package.json`中的`main`字段，指向`lib/index.js`,同时调整`lib`目录下`publish.js`的名字为`index.js`。

内容如下:

```js
"use strict";

module.exports = publish;

function publish() {
  console.log("执行publish命令成功");
}
```

### 注册服务

默认我们的服务都是从`https://openapi.logrolling.cn/staging/command`接口去获取的, 因为此时我们是本地开发，那么可以设置本地的环境变量替换掉线上的服务。

此处推荐`json-server`来开启一个本地的服务。

```json
npm install json-server -g
```

创建一个 mock 的目录

```bash
mkdir -p ~/Documents/mock && cd ~/Documents/mock
touch db.json routes.json
```

将如下内容放入到`db.json`文件中

```json
{
  "command": {
    "results": [
      {
        "command": "init",
        "commandContent": "init",
        "options": [
          {
            "flags": "-f, --force",
            "description": "是否强制初始化"
          }
        ],
        "description": "初始化一个项目",
        "packageName": "@xhh-cli-dev/init",
        "packageVersion": "latest"
      },
      {
        "command": "kill",
        "commandContent": "kill <port>",
        "description": "删掉对应端口号的进程",
        "packageName": "@xhh-cli-dev/kill",
        "packageVersion": "latest"
      }
    ]
  }
}
```

将如下内容放入到`routes.json`中

```json
{
  "/staging/command": "/command"
}
```

执行如下命令

```bash
json-server db.json --routes routes.json --watch
```

> 此处是有一个对应的后端服务的，目前暂时未开发添加功能，后面会补充



此时访问`http://localhost:3000/staging/command` 如果可以正常访问 则可以开始进入下一步

配置自定义`command`,在`db.json`中添加节点

```json
{
  "command": "publish",
  "commandContent": "publish",
  "description": "构建并发布项目到远程",
  "packageName": "@xhh-cli-dev/publish",
  "packageVersion": "latest"
}
```

> `command` 代表命令内容，`commandContent` 配置参数信息， `description`配置描述信息，`packageName`配置发布后的包名, `packageVersion`字段预留

在终端输入`xhh`,可以看到有打印`publish`信息，即代表发布成功

```
➜ xhh
xhh notice 当前脚手架版本号 0.3.0
Usage: xhh <command> [options]

Options:
  -d, --debug          是否开启调试模式 (default: false)
  -l, --local <local>  是否指定本地调试文件路径 (default: "")
  -V, --version        output the version number
  -h, --help           display help for command

Commands:
  init [options]       初始化一个项目
  kill <port>          删掉对应端口号的进程
  publish              构建并发布项目到远程
  help [command]       display help for command

```

创建环境变量文件，因为我们的很多变量替换均在配置文件中，所以此处我们进行环境变量替换工作

```bash
touch ~/.xhhenv
```

配置环境变量信息

```
XHH_CLI_BASE_URL=http://localhost:3000
```

> XHH_CLI_BASE_URL 的默认值为`https://openapi.logrolling.cn`



### 测试服务注册完成

`xhh`脚手架提供了本地调试功能，可以添加`-l`参数指定本地的执行文件，简单来讲就是先找到包，因为我们用的是`commonjs模块`，所以会找到其中的`main`字段对应的`js`文件，在终端执行如下命令即可进行测试。

```bash
➜ xhh publish -l ~/Documents/Git/xhh/xhh-cli/packages/commands/publish
xhh notice 当前脚手架版本号 0.3.0
执行publish命令成功
```

可以看到`执行publish命令成功`已经被打印了，此时我们就可以在这个包中进行相关功能开发了。
