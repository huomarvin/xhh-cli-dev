"use strict";

module.exports = { getLatestVersion, getDefaultRegistry };

const axios = require("axios");
const latestVersion = require("latest-version");
const urlJoin = require("url-join");
const semver = require("semver");
const log = require("@xhh-cli-dev/log");

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
      // log.error(err.message);
      return Promise.reject(err);
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
  // let res;
  // try {
  //   const info = await getNpmInfo(name);
  //   res = info ? info["dist-tags"].latest : null;
  // } catch (e) {
  //   log.verbose(`${name}可能还没有被发布过`);
  // } finally {
  //   return res;
  // }
  return latestVersion(name);
}

function getDefaultRegistry() {
  return "https://registry.npmjs.org";
  // return "https://registry.npm.taobao.org";
}
