"use strict";
const log = require("npmlog");

log.level = process.env.LOG_LEVEL ? process.env.LOG_LEVEL : "info";

log.heading = "xhh"; // 修改前缀
log.addLevel("success", 2000, { fg: "green", bold: true }); // 添加自定义命令

module.exports = log;
