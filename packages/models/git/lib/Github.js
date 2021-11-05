const GitServer = require("./GitServer");
const GitHubRequest = require("./GithubRequest");
const { GITHUB } = require("@xhh-cli-dev/consts");
const log = require("@xhh-cli-dev/log");

class Github extends GitServer {
  constructor() {
    super(GITHUB);
    this.token = "";
    this.request = null;
  }

  getTokenKeysUrl() {
    return "https://github.com/settings/tokens";
  }

  getTokenHelpUrl() {
    return "https://docs.github.com/cn/authentication/connecting-to-github-with-ssh/generating-a-new-ssh-key-and-adding-it-to-the-ssh-agent";
  }

  setToken(token) {
    this.token = token;
    this.request = new GitHubRequest(token);
  }

  getUser() {
    return this.request.get("/user");
  }

  getOrg() {
    return this.request.get(`/user/orgs`);
  }

  getRepo(login, name) {
    return this.request.get(`/repos/${login}/${name}`).catch((_err) => {
      log.verbose(_err);
      log.info(`${login}/${name}仓库不存在`);
      return null;
    });
  }

  createRepo(name) {
    return this.request.post(
      "/user/repos",
      { name },
      {
        Accept: "application/vnd.github.v3+json",
      }
    );
  }

  createOrgRepo(name, login) {
    return this.request.post(
      `/orgs/${login}/repos`,
      {
        name,
      },
      {
        Accept: "application/vnd.github.v3+json",
      }
    );
  }

  getRemote(login, name) {
    return `git@github.com:${login}/${name}.git`;
  } 
}

module.exports = Github;
