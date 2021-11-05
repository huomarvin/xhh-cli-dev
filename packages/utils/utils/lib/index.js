"use strict";
const fs = require("fs");

function isObject(obj) {
  return Object.prototype.toString.call(obj) === "[object Object]";
}

function spinnerStart(message, loading = "|/-\\") {
  const Spinner = require("cli-spinner").Spinner;
  const spinner = new Spinner(message + "%s");
  spinner.setSpinnerString(loading);
  spinner.start();
  return spinner;
}

function sleep(timer = 1000) {
  return new Promise((resolve) => setTimeout(resolve, timer));
}

async function doSpinner(message, callback, hooks = {}, loading = "|/-\\") {
  const { pre = () => {}, after = () => {}, final = () => {} } = hooks;
  const spinner = spinnerStart(message, loading);
  try {
    pre();
    await callback();
    after();
  } catch (error) {
    throw error;
  } finally {
    spinner.stop(true);
    final();
  }
}

const WHITE_LIST = ["npm"];
function checkCommand(cmd) {
  return WHITE_LIST.includes(cmd);
}

function readFile(path, options = {}) {
  if (fs.existsSync(path)) {
    const buffer = fs.readFileSync(path);
    if (options.toJson) {
      return buffer.toJSON();
    } else {
      return buffer.toString();
    }
  }
  return null;
}

function writeFile(path, data, { rewrite = true } = {}) {
  if (fs.existsSync(path)) {
    if (rewrite) {
      fs.writeFileSync(path, data);
      return true;
    }
    return false;
  } else {
    fs.writeFileSync(path, data);
    return true;
  }
}

/**
 * @param {array} arr
 */
function* asyncGenerator(arr) {
  let count = 0;
  while (count < arr.length) {
    yield arr[count++]();
  }
}

module.exports = {
  asyncGenerator,
  checkCommand,
  isObject,
  spinnerStart,
  sleep,
  doSpinner,
  readFile,
  writeFile,
};
