#! /usr/bin/env node

const improtLocal = require("import-local");

if (improtLocal(__filename)) {
  require("npmlog").info("cli", "正在使用xhh-cli本地版本");
} else {
  require("../lib")(process.argv.slice(2));
}
