"use strict";

const axios = require("axios");
const events = require("@xhh-cli-dev/event");

const baseURL = process.env.XHH_CLI_BASE_URL || "https://openapi.logrolling.cn";

const instance = axios.create({
  baseURL,
  timeout: 5000,
});

events.on("CLI_BASEURL_CHANGE", (baseURL) => {
  if (baseURL) instance.defaults.baseURL = baseURL;
});

instance.interceptors.response.use(
  function (response) {
    if (response.status === 200) return response.data;
    return response;
  },
  function (error) {
    return Promise.reject(error);
  }
);

module.exports = instance;
