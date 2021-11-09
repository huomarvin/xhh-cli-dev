"use strict";

module.exports = core;

const path = require("path");
const commander = require("commander");
const semver = require("semver");
const colors = require("colors");
const userHome = require("user-home");
const pathExists = require("path-exists").sync;
const log = require("@xhh-cli-dev/log");
const exec = require("@xhh-cli-dev/exec");
const events = require("@xhh-cli-dev/event");
const pkg = require("../package.json");
const constanst = require("./const");
const fse = require("fs-extra");
const { getCommands } = require("@xhh-cli-dev/api");

const { program } = commander;

async function core() {
  try {
    await prepare();
    await registerCommand();
  } catch (e) {
    console.log(e);
    log.error(e.message);
    log.verbose(e);
  }
}

async function prepare() {
  checkPkgVersion();
  checkRoot();
  checkUserHome();
  checkEnv();
  await checkGlobalUpdate();
}

async function registerCommand() {
  // 配置全局的options
  program
    .name(Object.keys(pkg.bin)[0])
    .usage("<command> [options]")
    .option("-d, --debug", "是否开启调试模式", false)
    .option("-l, --local <local>", "是否指定本地调试文件路径", "")
    .version(pkg.version);
  // 监听模式 如果是debug模式，要调整log等级
  program.on("option:debug", function () {
    if (program.opts().debug) {
      events.emit("LOG_LEVEL_CHANGE", "verbose");
    }
  });

  program.on("option:local", function () {
    process.env.CLI_LOCAL = program.opts().local;
  });

  const templateCommands = path.resolve(userHome, ".xhh_command.json");
  let commands;
  try {
    commands = await getCommands();
    if (!pathExists(templateCommands)) {
      fse.createFileSync(templateCommands);
    }
    fse.writeJSONSync(templateCommands, commands, { spaces: 2 });
  } catch (err) {
    // 接口报错后采用降级方案
    console.warn("采用降级处理", err.message);
    commands = fse.readJSONSync(templateCommands);
  } finally {
    if (!commands || !Array.isArray(commands)) {
      throw new Error("commands配置信息获取失败");
    }
  }
  const SETTINGS = {};
  commands.forEach((command) => {
    SETTINGS[command.command] = command.packageName;
  });

  // log.verbose("当前已注册命令", SETTINGS);
  commands.forEach((command) => {
    const { commandContent, options = [], description } = command;
    // program.command("init").option("-f, --force", "是否强制初始化").action(exec(config));
    const subCommnad = program.command(commandContent);
    description && subCommnad.description(description);
    options.forEach((option) => {
      subCommnad.option(option.flags, option.description, option.defaultValue);
    });
    subCommnad.action(exec(SETTINGS));
  });

  // 监听未知命令
  program.on("command:*", function (obj) {
    const availableCommands = program.commands.map((cmd) => cmd.name());
    log.info(colors.red("未知的命令" + obj));
    if (availableCommands.length > 0) {
      log.info(colors.red("可用命令：" + availableCommands.join(",")));
    }
  });

  program.parse(process.argv);

  // 当未输入command时或者仅输入-d --debug时打印帮助信息
  if (program.args && program.args.length < 1) {
    program.outputHelp();
    console.log();
  }
}

async function checkGlobalUpdate() {
  const { getLatestVersion } = require("@xhh-cli-dev/npm");
  // 获取当前版本号
  // 调用npm API 获取所有版本
  // 提起素有版本信息 比对哪些版本号是大于当前版本号的
  // 获取到最新的版本号，提示用户更新到最新的版本
  const lastVersion = await getLatestVersion(pkg.name);
  if (lastVersion && semver.gt(lastVersion, pkg.version)) {
    log.warn(
      colors.yellow(
        `请手动更新${pkg.name},当前版本为v${pkg.version},最新版本为v${lastVersion}
         更新命令为 npm install -g ${pkg.name}
        `
      )
    );
  }
}

// 将环境变量存放到本地文件中，在需要的时候去取
async function checkEnv() {
  const dotenv = require("dotenv");
  const dotenvPath = path.resolve(userHome, ".xhhenv");
  if (pathExists(dotenvPath)) {
    // 将文件中的信息读取到环境变量中去
    dotenv.config({ path: dotenvPath });
  } else {
    // 创建预留的配置文件
    fse.writeFileSync(dotenvPath, "KEY=VALUE");
  }
  createDefaultConfig();
  events.emit("CLI_BASEURL_CHANGE", process.env.XHH_CLI_BASE_URL);
  log.verbose("环境变量", process.env);
}

// 整理默认的环境变量配置信息
function createDefaultConfig() {
  const cliConfig = {
    home: userHome,
  };
  if (process.env.CLI_HOME) {
    cliConfig["cliHome"] = path.join(userHome, process.env.CLI_HOME);
  } else {
    cliConfig["cliHome"] = path.join(userHome, constanst.defaultCLIHome);
  }
  process.env.CLI_HOME_PATH = cliConfig["cliHome"];
}

// 提示当前cli的版本号
function checkPkgVersion() {
  log.notice("当前脚手架版本号", pkg.version);
}

// 对操作人进行降级，避免通过sudo启动后，使用普通用户没有操作文件夹权限问题
function checkRoot() {
  const rootCheck = require("root-check");
  // sudo启动后 process.getuid()的值为0 不同操作系统的默认值不一样，可以去rootCheck的源码中去查看
  // console.log(process.getuid());
  rootCheck();
  // console.log(process.getuid());
}

// 判断当前用户是否含有主目录
function checkUserHome() {
  if (!userHome || !pathExists(userHome)) {
    throw new Error(colors.red("当前登录用户主目录不存在"));
  }
}
