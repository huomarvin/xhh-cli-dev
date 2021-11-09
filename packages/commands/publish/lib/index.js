"use strict";

const Command = require("@xhh-cli-dev/command");
const log = require("@xhh-cli-dev/log");
const fse = require("fs-extra");
const path = require("path");
const Git = require("@xhh-cli-dev/git");

class PublishCommand extends Command {
  prepare() {
    // 1. 确定项目为npm项目
    const dir = process.cwd();
    const pkgPath = path.resolve(dir, "package.json");
    log.verbose("package.json", pkgPath);
    if (!fse.existsSync(pkgPath)) {
      throw new Error("package.json文件不存在");
    }
    // 2. 确定是否含有name/version/build命令
    const pkg = fse.readJSONSync(pkgPath);
    const { name, version, scripts } = pkg;
    log.verbose("package.json", name, version, scripts);
    if (!name || !version || !scripts || !scripts.build) {
      throw new Error(
        "package.json信息不全，请检查是否存在name/version/scripts/scripts(build)"
      );
    }
    this.projectInfo = { name, version, dir };
  }
  async exec() {
    try {
      const startTime = new Date().getTime();
      // 1. 初始化检查
      this.prepare();
      // 2. Git Flow自动化
      const git = new Git(this.projectInfo, this._argv);
      await git.prepare();
      await git.init();
      await git.commit();
      await git.publish();
      // 3 云构建和云发布
      const endTime = new Date().getTime();
      log.info(`本次发布耗时: ${Math.floor((endTime - startTime) / 1000)}秒`);
    } catch (error) {
      log.error(error.message);
    }
  }
  init() {
    log.verbose("publish", this._argv);
  }
}

module.exports = function (args) {
  return new PublishCommand(args);
};
