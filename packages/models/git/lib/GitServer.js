const throwError = (name) => {
  throw new Error(`${name}是一个必须要实现的方法`);
};

class GitServer {
  constructor(type, token) {
    this.type = type;
    this.token = token;
  }
  setToken() {
    throwError("setToken");
  }
  createRepo() {
    throwError("createRepo");
  }
  createOrgRepo() {
    throwError("createOrgRepo");
  }
  getRemote() {
    throwError("getRemote");
  }
  getUser() {
    throwError("getUser");
  }
  getOrg() {
    throwError("getOrg");
  }
  getSSHKeysUrl() {
    throwError("getSSHKeysUrl");
  }
  getTokenHelpUrl() {
    throwError("getTokenHelpUrl");
  }
  getRepo(login, name) {
    throwError("getRepo");
  }
}

module.exports = GitServer;
