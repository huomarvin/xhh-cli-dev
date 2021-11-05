"use strict";

const semver = require("semver");
const load = require("@commitlint/load").default;
const lint = require("@commitlint/lint").default;

const CONFIG = {
  extends: [require.resolve("@commitlint/config-conventional")],
};

const validateProjectName = (v) => {
  return /^[a-zA-Z]+([-][a-zA-Z][a-zA-Z0-9]*|[_][a-zA-Z][a-zA-Z0-9]*|[a-zA-Z0-9])*$/.test(
    v
  );
};

const validateProjectVersion = (v) => {
  return semver.valid(v);
};

const validateCommitMsg = async (message) => {
  return load(CONFIG).then((opts) =>
    lint(
      message,
      opts.rules,
      opts.parserPreset ? { parserOpts: opts.parserPreset.parserOpts } : {}
    )
  );
};

module.exports = {
  validateProjectName,
  validateProjectVersion,
  validateCommitMsg,
};
