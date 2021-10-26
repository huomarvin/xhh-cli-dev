"use strict";

module.exports = { getLatestVersion, getDefaultRegistry };

const axios = require("axios");
const latestVersion = require("latest-version");
const urlJoin = require("url-join");
const semver = require("semver");

function getNpmInfo(name) {
  if (!name) return null;
  const registryUrl = process.env.registry || getDefaultRegistry();
  const npmUrl = urlJoin(registryUrl, name);
  return axios
    .get(npmUrl)
    .then((res) => {
      if (res.status === 200) {
        return res.data;
      }
      return null;
    })
    .catch((err) => {
      Promise.reject(err);
    });
}

async function getNpmVersions(name) {
  const npmInfo = await getNpmInfo(name);
  return Object.keys(npmInfo.versions);
}

function getSemverVersions(baseVersion, versions) {
  return versions
    .filter((version) => semver.satisfies(version, `>=${baseVersion}`))
    .sort((a, b) => semver.gt(b, a));
}

async function getNpmSemverVersion(baseVersion, name) {
  const versions = await getNpmVersions(name);
  const newVersion = getSemverVersions(baseVersion, versions);
  if (newVersion && newVersion.length > 0) {
    return newVersion[0];
  }
  return null;
}

async function getLatestVersion(name) {
  const info = await getNpmInfo(name);
  return info["dist-tags"].latest;
  // return await latestVersion(name);
}

function getDefaultRegistry() {
  return "https://registry.npmjs.org";
  // return "https://registry.npm.taobao.org";
}
