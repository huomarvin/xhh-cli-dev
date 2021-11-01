# `log`

> 基于 npmlog 的日志文件

## Usage

```
const log = require('@xhh-cli-dev/log');

log.silly(prefix: string, message: string, ...args: any[]): void;
log.verbose(prefix: string, message: string, ...args: any[]): void;
log.info(prefix: string, message: string, ...args: any[]): void;
log.timing(prefix: string, message: string, ...args: any[]): void;
log.http(prefix: string, message: string, ...args: any[]): void;
log.notice(prefix: string, message: string, ...args: any[]): void;
log.warn(prefix: string, message: string, ...args: any[]): void;
log.error(prefix: string, message: string, ...args: any[]): void;
log.silent(prefix: string, message: string, ...args: any[]): void;
```
