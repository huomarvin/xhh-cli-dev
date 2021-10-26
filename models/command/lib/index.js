"use strict";

const semver = require("semver");
const colors = require("colors");
const constanst = require("./const");
const log = require("@xhh-cli-dev/log");

class Command {
  constructor(argv) {
    if (!argv) {
      throw new Error("argv不能为空");
    }
    if (!Array.isArray(argv)) {
      throw new Error("argv必须是数组");
    }
    if (argv.length < 1) {
      throw new Error("argv不能为空数组");
    }
    this._argv = argv;
    log.verbose("_argv", this._argv);
    let runner = new Promise((resolve, reject) => {
      let chain = Promise.resolve();
      chain.then(this.checkNodeVersion());
      chain.then(this.initArgs());
      chain.then(this.init());
      chain.then(this.exec());
      chain.catch((err) => {
        log.verbose("Commnad constructor", err.message);
      });
    });
  }
  initArgs() {
    // this._cmd = this._argv[this._argv.length - 1];
    this._options = this._argv[1] || {};
    this._argv = this._argv[0];
  }
  checkNodeVersion() {
    // 避免因为我们使用了低版本不支持的API而报错
    if (!semver.gte(process.version, constanst.lowestVersion)) {
      throw new Error(
        colors.red(
          `xhh-cli 需要安装v${constanst.lowestVersion} 以上版本的Node.js`
        )
      );
    }
  }
  init() {
    throw new Error("init必须被实现");
  }
  exec() {
    throw new Error("exec必须被实现");
  }
}

module.exports = Command;
