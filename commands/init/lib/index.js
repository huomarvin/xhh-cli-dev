"use strict";

const fs = require("fs");
const inquirer = require("inquirer");
const fse = require("fs-extra");
const spawn = require("cross-spawn");
const ejs = require("ejs");
const userHome = require("user-home");
const Commnad = require("@xhh-cli-dev/command");
const Package = require("@xhh-cli-dev/package");
const log = require("@xhh-cli-dev/log");
const {
  spinnerStart,
  sleep,
  doSpinner,
  checkCommand,
} = require("@xhh-cli-dev/utils");
const getProjectTemplate = require("./getProjectTemplate");

const {
  validateProjectName,
  validateProjectVersion,
} = require("@xhh-cli-dev/validate");

const PROJECT = "project";
const COMPONENT = "component";

const TEMPLATE_TYPE_NORMAL = "normal";
const TEMPLATE_TYPE_CUSTOME = "custom";

class InitCommand extends Commnad {
  init() {
    this.projectName = this._argv[0] || "";
    this.force = this._options.force || false;
    log.verbose("projectName", this.projectName);
    log.verbose("force", this.force);
  }
  async exec() {
    try {
      const projectInfo = await this.prepare();
      if (projectInfo) {
        await this.downloadTemplate();
        log.verbose("projectInfo", projectInfo);
        await this.installTemplate();
      }
    } catch (e) {
      log.error("出错了", e.message);
    }
  }

  async installTemplate() {
    if (this.tempInfo) {
      if (!this.tempInfo.type) {
        this.tempInfo.type = TEMPLATE_TYPE_NORMAL;
      }
      if (this.tempInfo.type === TEMPLATE_TYPE_NORMAL) {
        // 标准安装
        await this.installNormalTemplate();
      } else if (this.tempInfo.type === TEMPLATE_TYPE_CUSTOME) {
        // 自定义安装
        await this.installCustomTemplate();
      } else {
        throw new Error("无法识别项目模板类型");
      }
    } else {
      throw new Error("无法识别项目模板类型");
    }
  }
  async installNormalTemplate() {
    doSpinner(
      "正在安装模板...",
      () => {
        // 拷贝模板代码到当前目录
        const templatePath = path.resolve(this.pkg.cacheFilePath, "template");
        const targetPath = process.cwd();
        fse.ensureDirSync(templatePath);
        fse.ensureDirSync(targetPath);
        fse.copySync(templatePath, targetPath);
      },
      {
        final: () => {
          log.success("模板安装成功");
        },
      }
    );

    const ignore = ["node_module/**", ...this.tempInfo.ignore];
    // ejs 模板替换
    await this.renderEjs({ ignore });

    // TODO: 重构一下 安装和启动命令
    const { installCommand, startCommand } = this.tempInfo;
    if (installCommand) {
      const installCmd = installCommand.split(" ");
      const cmd = installCmd[0];
      if (!checkCommand(cmd)) {
        throw new Error(`${cmd} 不是一个安全的命令`);
      }
      const args = installCmd.slice(1);
      const child = spawn.sync(cmd, args, {
        cwd: process.cwd(),
        stdio: "inherit",
      });
      if (child.status === 0) {
        log.verbose("依赖安装成功");
      } else {
        throw child.error;
      }
    }
    // 项目启动
    if (startCommand) {
      const installCmd = startCommand.split(" ");
      const cmd = installCmd[0];
      if (!checkCommand(cmd)) {
        throw new Error(`${cmd} 不是一个安全的命令`);
      }
      const args = installCmd.slice(1);
      const child = spawn.sync(cmd, args, {
        cwd: process.cwd(),
        stdio: "inherit",
      });
      if (child.status === 0) {
        log.verbose("项目启动成功");
      } else {
        throw child.error;
      }
    }
  }

  renderEjs(options) {
    const dir = process.cwd();
    const projectInfo = this.projectInfo;
    return new Promise((resolve, reject) => {
      require("glob")(
        "**",
        {
          cwd: dir,
          ignore: options.ignore || "",
          nodir: true,
        },
        (err, files) => {
          if (err) reject(err);
          Promise.all(
            files.map((file) => {
              const filePath = path.resolve(dir, file);
              return new Promise((resolve, reject) => {
                ejs.renderFile(filePath, projectInfo, {}, (err, result) => {
                  if (err) reject(err);
                  fse.writeFileSync(filePath, result);
                  resolve();
                });
              });
            })
          )
            .then(resolve)
            .catch(reject);
        }
      );
    });
  }

  async installCustomTemplate() {
    console.log("安装自定义模板模板");
    // TODO: 读取对应package.json的顶层目录上入口文件并进行传参安装
  }

  async prepare() {
    this.templates = await getProjectTemplate();

    if (!this.templates || this.templates.length <= 0) {
      throw new Error("项目模板不存在");
    }

    // 1. 判断当前目录是否为空
    const localPath = process.cwd();
    if (!this.isDirEmpty(localPath)) {
      let ifContinue = false;
      if (!this.force) {
        // 询问是否继续创建
        ifContinue = (
          await inquirer.prompt({
            type: "confirm",
            name: "ifContinue",
            default: false,
            message: "当前文件夹不为空，是否继续创建项目？",
          })
        ).ifContinue;
        if (!ifContinue) {
          return;
        }
      }
      // 2. 是否启动强制更新
      if (ifContinue || this.force) {
        // 给用户做二次确认
        const { confirmDelete } = await inquirer.prompt({
          type: "confirm",
          name: "confirmDelete",
          default: false,
          message: "是否确认清空当前目录下的文件",
        });
        // 清空当前目录
        confirmDelete && fse.emptyDirSync(localPath);
      }
    }
    return this.getProjectInfo();
  }

  async getProjectInfo() {
    // 3. 选择创建项目或组件
    const { type } = await inquirer.prompt({
      type: "list",
      name: "type",
      message: "请选择初始化类型",
      default: PROJECT,
      choices: [
        { name: "项目", value: PROJECT },
        { name: "组件", value: COMPONENT },
      ],
    });
    log.verbose("type", type);
    const promptList = [
      {
        type: "input",
        name: "projectName",
        message: "请输入项目名称",
        default: "",
        validate: function (v) {
          const done = this.async();
          setTimeout(function () {
            if (!validateProjectName(v)) {
              done("请输入合法的项目名称");
              return;
            }
            done(null, true);
          });
        },
        filter: (v) => v,
      },
      {
        type: "input",
        name: "projectVersion",
        message: "请输入项目版本号",
        default: "1.0.0",
        validate: function (v) {
          const done = this.async();
          setTimeout(function () {
            if (!validateProjectVersion(v)) {
              done("请输入合法的项目版本");
              return;
            }
            done(null, true);
          });
        },
        filter: (v) => {
          const version = validateProjectVersion(v);
          if (!!version) {
            return version;
          }
        },
      },
      {
        type: "list",
        name: "templateName",
        message: "请选择项目模板",
        choices: this.createTemplateList().filter(
          (x) => x.tag && x.tag.includes(type)
        ),
      },
    ];
    let projectInfo;
    if (type === PROJECT) {
      projectInfo = await inquirer.prompt(promptList);
    } else if (type === COMPONENT) {
      promptList.push({
        type: "input",
        name: "description",
        message: "请输入组件描述信息",
        default: "",
        validate: function (v) {
          const done = this.async();
          setTimeout(() => {
            if (!v) {
              done("请输入组件描述信息");
              return;
            }
            done(null, true);
          }, 0);
        },
      });
      projectInfo = await inquirer.prompt(promptList);
    }
    if (projectInfo.projectName) {
      // 驼峰转换成中划线
      projectInfo.className = require("kebab-case")(
        projectInfo.projectName
      ).replace(/^-/, "");
    }
    if (projectInfo.projectVersion) {
      projectInfo.version = projectInfo.projectVersion;
    }

    // 4. 获取项目的基本信息
    this.projectInfo = { ...projectInfo, type };
    log.verbose("projectInfo信息为", this.projectInfo);
    return this.projectInfo;
  }
  createTemplateList() {
    return this.templates.map((item) => ({
      value: item.npmName,
      name: item.name,
      tag: item.tag,
    }));
  }

  async downloadTemplate() {
    // 通过项目模板API获取项目模板信息
    // 1 通过nest搭建一套后端系统
    // 2 通过npm存储项目模板
    // 3 将项目模板信息存储到mongodb数据库中
    // 4 通过nest获取mongodb中的数据并且通过API返回
    const projectTemp = this.projectInfo;
    this.tempInfo = this.templates.find(
      (x) => x.npmName === projectTemp.templateName
    );
    log.verbose("tempInfo", this.tempInfo);
    const targetPath = path.resolve(userHome, ".xhh-cli", "template");
    const storePath = path.resolve(targetPath, "node_modules");
    const { npmName, version } = this.tempInfo;
    const pkg = new Package({
      targetPath,
      storePath,
      packageName: npmName,
      packageVersion: version,
    });
    this.pkg = pkg;
    log.verbose("pkg", pkg);
    if (await pkg.exist()) {
      const spinner = spinnerStart("正在更新模板...");
      try {
        await sleep(1000);
        await pkg.update();
      } catch (error) {
        throw error;
      } finally {
        spinner.stop(true);
        if (pkg.exist()) log.success("模板更新成功");
      }
    } else {
      const spinner = spinnerStart("正在下载模板...");
      try {
        await sleep(1000);
        await pkg.install();
      } catch (error) {
        throw error;
      } finally {
        spinner.stop(true);
        if (pkg.exist()) log.success("模板下载成功");
      }
    }
  }

  isDirEmpty(localPath) {
    const fileList = fs.readdirSync(localPath);
    // 处理过滤逻辑，比如有.git目录等
    // fileList = fileList.filter((file) => file);
    return !fileList || fileList.length <= 0;
  }
}

module.exports = function (args) {
  return new InitCommand(args);
};
