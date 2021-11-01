"use strict";

const path = require("path");
const spawn = require("cross-spawn");
const log = require("@xhh-cli-dev/log");
const Package = require("@xhh-cli-dev/package");

module.exports = exec;

const CACHE_DIR = "dependencies";

function exec(SETTINGS) {
  return async function () {
    log.verbose(
      "exec arguments",
      Array.from(arguments).slice(0, arguments.length - 1)
    );
    let storePath, packageIns;
    let local = process.env.CLI_LOCAL;
    const homePath = process.env.CLI_HOME_PATH;
    log.verbose("local", local);
    log.verbose("homePath", homePath);
    const cmdObj = arguments[arguments.length - 1];
    const packageName = SETTINGS[cmdObj.name()];
    const packageVersion = "latest";
    if (!local) {
      local = path.resolve(homePath, CACHE_DIR);
      storePath = path.resolve(local, "node_modules");
      log.verbose("local", local);
      log.verbose("storePath", storePath);
      packageIns = new Package({
        local,
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
        local,
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
  };
}
