"use strict";
const fs = require("fs");
const path = require("path");
const semver = require("semver");
// cache file
const GIT_SERVER_FILE = ".git_server";
const GIT_TOKEN_FILE = ".git_token";
const GIT_CONFIG = ".git";
const GIT_OWN_FILE = ".git_own";
const GIT_LOGIN_FILE = ".git_login";
const GIT_IGNORE_FILE = ".gitignore";

// consts
const GITHUB = "github";
const GITEE = "gitee";

// api config
const GITEE_URL = "https://gitee.com/api/v5";
const GITHUB_URL = "https://api.github.com";

// promt choice
const GIT_SERVER_TYPE = [
  {
    name: "Github",
    value: GITHUB,
  },
  {
    name: "Gitee",
    value: GITEE,
  },
];

const REPO_OWNER_USER = "REPO_OWNER_USER";
const REPO_OWNER_ORG = "REPO_OWNER_ORG";

const GIT_OWNER_TYPE = [
  {
    name: "个人",
    value: REPO_OWNER_USER,
  },
  {
    name: "组织",
    value: REPO_OWNER_ORG,
  },
];

const NODE_IGNORE = fs.readFileSync(
  path.resolve(__dirname, "Node.gitignore"),
  "utf-8"
);

const VERSION_RELEASE = "release";
const VERSION_DEVELOP = "develop";

const VERSION_TYPES = (version) => {
  // Return the version incremented by the release type (major, minor, patch, or prerelease), or null if it's not valid.
  return ["patch", "minor", "major"].map((value) => ({
    name: `${version} => ${semver.inc(version, value)}`,
    value,
  }));
};

const COMMIT_TYPES = [
  { name: "feat：新功能（feature)", value: "feat" },
  { name: "fix：修补bug", value: "fix" },
  { name: "docs：文档（documentation)", value: "docs" },
  { name: "style： 格式（不影响代码运行的变动)", value: "style" },
  {
    name: "refactor：重构（即不是新增功能，也不是修改bug的代码变动)",
    value: "refactor",
  },
  { name: "test：增加测试", value: "test" },
  { name: "chore：构建过程或辅助工具的变动", value: "chore" },
];

module.exports = {
  COMMIT_TYPES,
  VERSION_TYPES,
  VERSION_DEVELOP,
  VERSION_RELEASE,
  NODE_IGNORE,
  GIT_IGNORE_FILE,
  REPO_OWNER_USER,
  REPO_OWNER_ORG,
  GIT_OWNER_TYPE,
  GIT_SERVER_FILE,
  GIT_TOKEN_FILE,
  GIT_CONFIG,
  GIT_OWN_FILE,
  GITHUB,
  GITHUB_URL,
  GITEE,
  GITEE_URL,
  GIT_SERVER_TYPE,
  GIT_LOGIN_FILE,
};
