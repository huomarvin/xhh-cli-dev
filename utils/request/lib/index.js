"use strict";

const axios = require("axios");

const baseURL = process.env.XHH_CLI_BASE_URL || "http://localhost:3000";

const instance = axios.create({
  baseURL,
  timeout: 5000,
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
