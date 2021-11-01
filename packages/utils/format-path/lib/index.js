"use strict";

module.exports = formatPath;

const path = require("path");

// 处理windows与macOS差异
function formatPath(p) {
  if (p && typeof p === "string") {
    const seq = path.seq;
    if (seq === "/") {
      return p;
    } else {
      return p.replace(/\\/g, "/");
    }
  }
  return p;
}
