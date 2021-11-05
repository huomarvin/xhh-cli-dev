"use strict";

const path = require("path");
const SimpleGit = require("simple-git");
const terminalLink = require("terminal-link");
const fse = require("fs-extra");
const log = require("@xhh-cli-dev/log");
const inquirer = require("inquirer");
const semver = require("semver");
const {
  writeFile,
  readFile,
  doSpinner,
  asyncGenerator,
} = require("@xhh-cli-dev/utils");
const Github = require("./Github");
const Gitee = require("./Gitee");

const {
  GIT_SERVER_FILE,
  GIT_CONFIG,
  GITHUB,
  GITEE,
  GIT_TOKEN_FILE,
  GIT_SERVER_TYPE,
  GIT_OWN_FILE,
  GIT_LOGIN_FILE,
  GIT_OWNER_TYPE,
  REPO_OWNER_USER,
  GIT_IGNORE_FILE,
  NODE_IGNORE,
  VERSION_RELEASE,
  VERSION_DEVELOP,
  VERSION_TYPES,
  COMMIT_TYPES,
} = require("@xhh-cli-dev/consts");

class Git {
  constructor(
    { name, version, dir },
    { refreshServer, refreshToken, refreshOwner }
  ) {
    this.name = name;
    this.version = version;
    this.dir = dir;
    this.git = SimpleGit(this.dir);
    this.gitServer = null;
    this.homePath = null;
    this.owner = null;
    this.login = null;
    this.remote = null;
    this.refreshServer = refreshServer;
    this.refreshToken = refreshToken;
    this.refreshOwner = refreshOwner;
    this.branch = null; // 本地开发分支
  }

  async prepare() {
    this.checkHomePath(); // 检查缓存目录
    await this.checkGitServer(); // 检查用户远程仓库类型
    await this.checkGitToken(); // 获取远程仓库token
    await this.getUserAndOrgs(); // 获取用户和组织信息
    await this.checkGitOwner(); // 确认远程仓库类型
    await this.checkRepo(); // 检查并创建远程仓库
    this.checkGitIgnore(); // 检查并创建.gitinore
  }

  checkGitIgnore() {
    const gitIgnore = path.resolve(this.dir, GIT_IGNORE_FILE);
    if (!fse.existsSync(gitIgnore)) {
      writeFile(gitIgnore, NODE_IGNORE);
    }
  }

  async checkRepo() {
    let repo = await this.gitServer.getRepo(this.login, this.name);
    if (!repo) {
      await doSpinner(
        "开始创建远程仓库...",
        async () => {
          if (this.owner === REPO_OWNER_USER) {
            repo = await this.gitServer.createRepo(this.name);
          } else {
            repo = await this.gitServer.createOrgRepo(this.name, this.login);
          }
        },
        {}
      );
      if (repo) {
        log.verbose("repo", repo);
        log.success("远程仓库创建成功");
      } else {
        throw new Error("远程仓库创建失败");
      }
    } else {
      log.success("远程仓库信息获取成功");
    }
  }

  async checkGitOwner() {
    const ownerPath = this.createPath(GIT_OWN_FILE);
    const loginPath = this.createPath(GIT_LOGIN_FILE);
    let owner = readFile(ownerPath);
    let login = readFile(loginPath);
    if (!owner || !login || this.refreshOwner) {
      if (this.orgs.length > 0) {
        owner = (
          await inquirer.prompt({
            type: "list",
            name: "owner",
            message: "请选择远程仓库类型",
            default: REPO_OWNER_USER,
            choices: GIT_OWNER_TYPE,
          })
        ).owner;
      } else {
        // 没有组织直接设置个人
        owner = REPO_OWNER_USER;
      }
      if (owner === REPO_OWNER_USER) {
        login = this.user.login;
      } else {
        login = (
          await inquirer.prompt({
            type: "list",
            name: "login",
            message: "请选择",
            choices: this.orgs.map((item) => ({
              name: item.login,
              value: item.login,
            })),
          })
        ).login;
      }
      writeFile(ownerPath, owner);
      writeFile(loginPath, login);
      log.success("owner写入成功", `${owner} -> ${ownerPath}`);
      log.success("login写入成功", `${login} -> ${loginPath}`);
    } else {
      log.success("owner获取成功");
      log.success("login获取成功");
    }
    this.owner = owner;
    this.login = login;
  }

  async getUserAndOrgs() {
    this.user = await this.gitServer.getUser();
    if (!this.user) throw new Error("用户信息获取失败");
    this.orgs = await this.gitServer.getOrg(this.user.login);
    if (!this.orgs) throw new Error("组织信息获取失败");
    log.success(this.gitServer.type + " 用户和组织信息获取成功");
  }

  async checkGitServer() {
    const gitServerPath = this.createPath(GIT_SERVER_FILE);
    let gitServer = readFile(gitServerPath);
    if (!gitServer || this.refreshServer) {
      gitServer = (
        await inquirer.prompt({
          type: "list",
          name: "gitServer",
          message: "请选择您想要托管的Git平台",
          default: GITHUB,
          choices: GIT_SERVER_TYPE,
        })
      ).gitServer;
      writeFile(gitServerPath, gitServer);
      log.success("git server 写入成功", `${gitServer} => ${gitServerPath}`);
    } else {
      log.success("git server获取成功", gitServer);
    }
    this.gitServer = this.createGitServer(gitServer);
    if (!this.gitServer)
      throw new Error("GitServer初始化失败，请添加-r参数进行重置操作");
  }

  async checkGitToken() {
    const tokenPath = this.createPath(GIT_TOKEN_FILE);
    let token = readFile(tokenPath);
    if (!token || this.refreshToken) {
      log.warn(
        `${this.gitServer.type}token未生成, 请先生成${
          this.gitServer.type
        } token， ${terminalLink(
          "请点击参考链接",
          this.gitServer.getTokenKeysUrl()
        )}`
      );
      token = (
        await inquirer.prompt({
          type: "password",
          name: "token",
          message: "请将token复制到这里",
          default: "",
        })
      ).token;
      writeFile(tokenPath, token);
      log.success("token写入成功", `${token} -> ${tokenPath}`);
    } else {
      log.success("token获取成功", tokenPath);
    }
    this.token = token;
    this.gitServer.setToken(token);
  }

  createGitServer(gitServer) {
    if (gitServer === GITHUB) {
      return new Github();
    } else if (gitServer === GITEE) {
      return new Gitee();
    }
    return null;
  }

  createPath(fileName) {
    const rootDir = path.resolve(this.homePath, GIT_CONFIG);
    const filePath = path.resolve(rootDir, fileName);
    fse.createFileSync(filePath);
    return filePath;
  }

  checkHomePath() {
    if (!this.homePath && process.env.CLI_HOME_PATH) {
      this.homePath = process.env.CLI_HOME_PATH;
      log.verbose("homePath", this.homePath);
    } else {
      throw new Error("CLI_HOME_PATH没有准备完成");
    }
    if (!fse.pathExistsSync(this.homePath)) {
      throw new Error(`${this.homePath}目录不存在`);
    }
  }

  async init() {
    if (await this.getRemote()) {
      return;
    }
    await this.initAndAddRemote();
    await this.initCommit();
    if (await this.checkRemoteMaster()) {
      await this.pullRemoteRepo("master", {
        "--allow-unrelated-histories": null,
      });
    } else {
      await this.pushRemoteRepo("master");
    }
  }

  async pushRemoteRepo(branchName) {
    log.info(`推送代码至${branchName}分支`);
    await this.git.push("origin", branchName);
    log.success("推送代码成功");
  }

  async pullRemoteRepo(branchName, options) {
    log.info(`同步远程${branchName}分支代码`);
    await this.git.pull("origin", branchName, options).catch((err) => {
      log.error(err.message);
    });
  }

  async checkRemoteMaster() {
    return (
      (await this.git.listRemote(["--refs"])).indexOf("refs/heads/master") >= 0
    );
  }

  async initCommit() {
    const status = await this.checkConflicted();
    log.verbose("status", status);
    const list = [
      status.not_added,
      status.created,
      status.deleted,
      status.modified,
      status.renamed,
    ];
    if (list.some((status) => status.length > 0)) {
      // list.map(async (item) => await this.git.add(item));
      const gen = asyncGenerator(list.map((x) => () => this.git.add(x)));
      for await (const x of gen);
      // await this.git.add(status.not_added);
      // await this.git.add(status.created);
      // await this.git.add(status.deleted);
      // await this.git.add(status.modified);
      // await this.git.add(status.renamed);
      let message;
      while (!message) {
        let answer;
        answer = await inquirer.prompt([
          {
            type: "list",
            name: "commitType",
            message: "请选择本次提交类型",
            default: "feat",
            choices: COMMIT_TYPES,
          },
          {
            type: "text",
            name: "message",
            message: "请输入commit信息",
            validate: function (v) {
              const done = this.async();
              setTimeout(function () {
                if (!v) {
                  done("请输入commit信息");
                  return;
                }
                done(null, true);
              });
            },
          },
        ]);
        console.log(answer);
        message = `${answer.commitType}: ${answer.message}`;
      }
      await this.git.commit(message);
      log.success(`本地提交成功, message信息为 ${message}`);
    }
  }

  async checkConflicted() {
    log.info("代码冲突检查");
    const status = await this.git.status();
    if (status.conflicted.length > 0) {
      throw new Error("当前代码存在冲突，请手动处理合并后再试");
    }
    return status;
  }

  getRemote() {
    const gitPath = path.resolve(this.dir, GIT_CONFIG);
    this.remote = this.gitServer.getRemote(this.login, this.name);
    if (fse.existsSync(gitPath)) {
      log.success("git已完成初始化");
      return true;
    }
  }

  async initAndAddRemote() {
    log.info("执行git初始化");
    await this.git.init(this.dir);
    log.info("添加git remote");
    const remotes = await this.git.getRemotes();
    log.verbose("git remotes", remotes);
    if (!remotes.find((item) => item.name === "origin")) {
      await this.git.addRemote("origin", this.remote);
    }
  }

  async commit() {
    // 生成开发分支
    await this.getCorrectVersion();
    // 检查stash区
    await this.checkStash();
    // 检查代码冲突
    await this.checkConflicted();
    // 切换开发分支
    await this.checkoutBranch(this.branch);
    // 合并远程master分支和开发分支代码
    await this.pullRemoteMasterAndBranch();
    // 提交本地代码
    await this.initCommit();
    // 将开发分支推送到远程仓库
    await this.pushRemoteRepo(this.branch);
  }

  async pullRemoteMasterAndBranch() {
    log.info(`合并 [master] -> [${this.branch}]`);
    await this.pullRemoteRepo("master");
    log.success("合并远程 [master] 分支代码成功");
    await this.checkConflicted();
    log.info("检查远程开发分支");
    const remoteBranchList = await this.getRemoteBranchList();
    if (remoteBranchList.includes(this.version)) {
      log.info(`合并 [${this.branch}] -> [${this.branch}]`);
      await this.pullRemoteRepo(this.branch);
      log.success(`合并远程 [${this.branch}] 分支代码成功`);
      await this.checkConflicted();
    } else {
      log.success(`不存在远程分支 [${this.branch}]`);
    }
  }

  async checkoutBranch(branch) {
    const localBranchList = await this.git.branchLocal();
    if (localBranchList.all.includes(branch)) {
      // git checkout branch
      await this.git.checkout(branch);
    } else {
      // git cehckout -b branch
      await this.git.checkoutLocalBranch(branch);
    }
    log.success(`分支切换到${branch}`);
  }

  async checkStash() {
    log.info("检查stash记录");
    const stashList = await this.git.stashList();
    if (stashList.all.length > 0) {
      await this.git.stash(["pop"]);
      log.success("stash pop 成功");
    }
  }

  async getCorrectVersion() {
    log.info("获取代码分支");
    const remoteBranchList = await this.getRemoteBranchList(VERSION_RELEASE);
    let releaseVersion = null;
    if (remoteBranchList && remoteBranchList.length > 0) {
      releaseVersion = remoteBranchList[0];
    }
    log.verbose("线上最新的版本号是", releaseVersion);
    const devVersion = this.version;
    if (!releaseVersion) {
      // 第一次创建 远程没有release分支
      this.branch = `${VERSION_DEVELOP}/${devVersion}`;
    } else if (semver.gt(this.version, releaseVersion)) {
      // 本地版本大于线上的最大版本，代表是新拉取的分支
      log.info(
        "当前版本大于线上最新版本",
        `${devVersion} >= ${releaseVersion}`
      );
      this.branch = `${VERSION_DEVELOP}/${devVersion}`;
    } else {
      // 线上版本大于本地版本，要对本地版本做更新
      log.info("当前线上版本大于本地版本", `${releaseVersion} > ${devVersion}`);
      const incType = (
        await inquirer.prompt({
          type: "list",
          name: "incType",
          message: "自动升级版本，请选择升级版本类型",
          default: "patch",
          choices: VERSION_TYPES(releaseVersion),
        })
      ).incType;
      const incVersion = semver.inc(releaseVersion, incType);
      this.branch = `${VERSION_DEVELOP}/${incVersion}`;
      this.version = incVersion;
      log.verbose("本地开发分支", this.branch);
      this.syncVersionToPackageJson();
    }
  }

  syncVersionToPackageJson() {
    const pkg = fse.readJSONSync(`${this.dir}/package.json`);
    if (pkg && pkg.version !== this.version) {
      pkg.version = this.version;
      fse.writeJSONSync(`${this.dir}/package.json`, pkg, { spaces: 2 });
    }
  }

  async getRemoteBranchList(type) {
    const remoteList = await this.git.listRemote(["--refs"]);
    let reg;
    if (type === VERSION_RELEASE) {
      reg = /.+?refs\/tags\/release\/(\d+\.\d+\.\d+)/g;
    } else {
      reg = /.+?refs\/heads\/develop\/(\d+\.\d+\.\d+)/g;
    }
    return remoteList
      .split("\n")
      .map((remote) => {
        const match = reg.exec(remote);
        reg.lastIndex = 0;
        if (match && semver.valid(match[1])) {
          return match[1];
        }
      })
      .filter(Boolean)
      .sort((a, b) => {
        if (semver.lte(a, b)) {
          if (a === b) return 0;
          return 1;
        } else {
          return -1;
        }
      });
  }
}

module.exports = Git;
