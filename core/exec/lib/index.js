"use strict";

const path = require("path");
// const cp = require("child_process");
const spawn = require("cross-spawn");
const log = require("@xhh-cli-dev/log");
const Package = require("@xhh-cli-dev/package");

module.exports = exec;

const SETTINGS = {
  init: "@imooc-cli/init",
};
const CACHE_DIR = "dependencies";

async function exec() {
  let storePath, packageIns;
  let targetPath = process.env.CLI_TARGET_PATH;
  const homePath = process.env.CLI_HOME_PATH;
  log.verbose("targetPath", targetPath);
  log.verbose("homePath", homePath);
  const cmdObj = arguments[arguments.length - 1];
  const packageName = SETTINGS[cmdObj.name()];
  const packageVersion = "latest";
  if (!targetPath) {
    targetPath = path.resolve(homePath, CACHE_DIR);
    storePath = path.resolve(targetPath, "node_modules");
    log.verbose("targetPath", targetPath);
    log.verbose("storePath", storePath);
    packageIns = new Package({
      targetPath,
      storePath,
      packageName,
      packageVersion,
    });
    if (await packageIns.exist()) {
      // 更新
      log.verbose(`更新${packageIns.packageName}`);
      packageIns.update();
    } else {
      // 安装
      log.verbose(`安装${packageIns.packageName}`);
      await packageIns.install();
    }
  } else {
    packageIns = new Package({
      targetPath,
      packageName,
      packageVersion,
    });
  }
  const execFile = packageIns.getRootPath();
  log.verbose("execFile", execFile);
  if (execFile) {
    const newArgs = Array.from(arguments);
    let code = `require('${execFile}').call(null,${JSON.stringify(
      newArgs.slice(0, newArgs.length - 1)
    )})`;
    const child = spawn("node", ["-e", code], {
      cwd: process.cwd(),
      stdio: "inherit",
    });
    child.on("error", (error) => {
      log.error(error.message);
      process.exit(1);
    });
    child.on("exit", (e) => {
      log.verbose("命令执行成功");
      process.exit(e);
    });
  }
}
