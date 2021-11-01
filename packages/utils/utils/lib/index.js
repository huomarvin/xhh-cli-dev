"use strict";

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

module.exports = {
  checkCommand,
  isObject,
  spinnerStart,
  sleep,
  doSpinner,
};
