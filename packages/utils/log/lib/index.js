"use strict";
const log = require("npmlog");
const events = require("@xhh-cli-dev/event");

log.level = "info";

log.heading = "xhh"; // 修改前缀
log.addLevel("success", 2000, { fg: "green", bold: true }); // 添加自定义命令

events.on("LOG_LEVEL_CHANGE", function (level) {
  log.level = level;
});

module.exports = log;
