const request = require("@xhh-cli-dev/request");

module.exports = function () {
  return request.get("/project");
};
