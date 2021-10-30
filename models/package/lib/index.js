"use strict";

const path = require("path");
const fse = require("fs-extra");
const pkgDir = require("pkg-dir").sync;
const npminstall = require("npminstall");
const pathExists = require("path-exists").sync;
const log = require("@xhh-cli-dev/log");
const { isObject } = require("@xhh-cli-dev/utils");
const { getDefaultRegistry, getLatestVersion } = require("@xhh-cli-dev/npm");
const formatPath = require("@xhh-cli-dev/format-path");

class Package {
  constructor(options) {
    if (!options) {
      throw new Error("Package的options参数不可为空");
    }
    if (!isObject(options)) {
      throw new Error("Package的options参数必须是一个对象");
    }
    this.targetPath = options.targetPath;
    this.packageVersion = options.packageVersion;
    this.packageName = options.packageName;
    this.storePath = options.storePath;
    this.cacheFilePathPrefix = this.packageName.replace(/\//g, "_");
  }

  // 获取入口文件路径
  getRootPath() {
    function _getRootPath(targetPath) {
      const rootPath = pkgDir(targetPath);
      if (rootPath) {
        const pkgFile = require(path.join(rootPath, "package.json"));
        if (pkgFile && pkgFile.main) {
          return formatPath(path.join(rootPath, pkgFile.main));
        }
      }
      return null;
    }
    if (this.storePath) {
      return _getRootPath(this.cacheFilePath);
    } else {
      return _getRootPath(this.targetPath);
    }
  }

  async install(newVersion) {
    await this.prepare();
    return npminstall({
      root: this.targetPath,
      storeDir: this.storePath,
      registry: getDefaultRegistry(),
      pkgs: [
        {
          name: this.packageName,
          version: newVersion || this.packageVersion,
        },
      ],
    });
  }

  async prepare() {
    if (this.storePath && !pathExists(this.storePath)) {
      fse.mkdirpSync(this.storePath);
    }
    if (this.packageVersion === "latest") {
      this.packageVersion = await getLatestVersion(this.packageName);
    }
  }

  get cacheFilePath() {
    return path.resolve(
      this.storePath,
      `_${this.cacheFilePathPrefix}@${this.packageVersion}@${this.packageName}`
    );
  }

  getCacheFilePathByVersion(version) {
    return path.resolve(
      this.storePath,
      `_${this.cacheFilePathPrefix}@${version}@${this.packageName}`
    );
  }

  async exist() {
    if (this.storePath) {
      await this.prepare();
      log.verbose("cacheFilePath", this.cacheFilePath);
      return pathExists(this.cacheFilePath);
    } else {
      return pathExists(this.targetPath);
    }
  }

  async update() {
    await this.prepare();
    // 1、获取包的最新版本
    const latestVersion = await getLatestVersion(this.packageName);
    // 2、查看最新的版本在缓存换件中是否已经存在
    const latestVersionPath = this.getCacheFilePathByVersion(latestVersion);
    // 3、如果不存在，则直接安装最新版本
    if (!pathExists(latestVersionPath)) {
      await this.install(latestVersion);
      this.packageVersion = latestVersion;
    }
  }
}

module.exports = Package;
