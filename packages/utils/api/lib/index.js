const request = require("@xhh-cli-dev/request");

const getCommands = () => request.get("/staging/command");

module.exports = {
  getCommands,
};
