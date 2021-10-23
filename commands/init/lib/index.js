"use strict";

const Commnad = require("@xhh-cli-dev/command");
const log = require("@xhh-cli-dev/log");

class InitCommand extends Commnad {
  init() {
    this.projectName = this._argv[0] || "";
    this.force = this._options.force || false;
    log.verbose("projectName", this.projectName);
    log.verbose("force", this.force);
  }
  exec() {}
}

module.exports = function (args) {
  return new InitCommand(args);
};
