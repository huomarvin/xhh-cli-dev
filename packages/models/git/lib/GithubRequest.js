const axios = require("axios");
const log = require("@xhh-cli-dev/log");
const { GITHUB_URL } = require("@xhh-cli-dev/consts");

class GithubRequest {
  constructor(token) {
    this.token = token;
    this.service = axios.create({
      baseURL: GITHUB_URL,
      timeout: 5000,
    });
    this.service.interceptors.request.use(
      (config) => {
        config.headers["Authorization"] = `token ${this.token}`;
        return config;
      },
      (error) => {
        Promise.reject(error);
      }
    );
    this.service.interceptors.response.use(
      (response) => {
        if (response.status >= 200 && response.status < 300)
          return response.data;
        return null;
      },
      (error) => {
        // error.response &&
        //   error.response.data &&
        //   log.error(error.response && JSON.stringify(error.response.data));
        return Promise.reject(error);
      }
    );
  }
  get(url, headers) {
    return this.service({
      url,
      method: "get",
      headers,
    });
  }
  post(url, data, headers) {
    return this.service({
      url,
      data,
      method: "post",
      headers,
    });
  }
}

module.exports = GithubRequest;
