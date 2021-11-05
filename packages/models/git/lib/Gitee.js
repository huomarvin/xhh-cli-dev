const GitServer = require("./GitServer");
const GiteeRequest = require("./GiteeRequest");
const log = require("@xhh-cli-dev/log");

const { GITEE } = require("@xhh-cli-dev/consts");

class Gitee extends GitServer {
  constructor() {
    super(GITEE);
    this.request = null;
  }
  getTokenKeysUrl() {
    return "https://gitee.com/personal_access_tokens";
  }
  getTokenHelpUrl() {
    return "https://gitee.com/help/articles/4191";
  }
  setToken(token) {
    this.token = token;
    this.request = new GiteeRequest(token);
  }
  getUser() {
    return this.request.get("/user");
  }
  getOrg(username) {
    return this.request.get(`/users/${username}/orgs`);
  }
  getRepo(login, name) {
    return this.request.get(`/repos/${login}/${name}`).catch((_err) => {
      log.verbose(_err);
      log.info(`${login}/${name}仓库不存在`);
      return null;
    });
  }
  createRepo(name) {
    // POST https://gitee.com/api/v5/user/repos
    return this.request.post("/user/repos", { name });
  }
  createOrgRepo(name, login) {
    return this.request.post(`/orgs/${login}/repos`, {
      name,
    });
  }
  getRemote(login, name) {
    return `git@gitee.com:${login}/${name}.git`;
  }
}

module.exports = Gitee;
