"use strict";

module.exports = killer;

const kill = require("kill-port");
const log = require("@xhh-cli-dev/log");
function killer(...args) {
  const [[port]] = args;
  kill(port, "tcp")
    .then(() => log.success(`端口${port}清理成功`))
    .catch(console.log);
}
