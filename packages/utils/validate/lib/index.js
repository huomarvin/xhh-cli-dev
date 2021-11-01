"use strict";

const semver = require("semver");

const validateProjectName = (v) => {
  return /^[a-zA-Z]+([-][a-zA-Z][a-zA-Z0-9]*|[_][a-zA-Z][a-zA-Z0-9]*|[a-zA-Z0-9])*$/.test(
    v
  );
};

const validateProjectVersion = (v) => {
  return semver.valid(v);
};

module.exports = { validateProjectName, validateProjectVersion };
