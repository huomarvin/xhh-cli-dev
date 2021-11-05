const axios = require("axios");

const { GITEE_URL } = require("@xhh-cli-dev/consts");
const log = require("@xhh-cli-dev/log");

class GiteeRequest {
  constructor(token) {
    this.token = token;
    this.service = axios.create({
      baseURL: GITEE_URL,
      timeout: 5000,
    });
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
  get(url, params, headers) {
    return this.service({
      url,
      params: {
        ...params,
        access_token: this.token,
      },
      method: "get",
      headers,
    });
  }
  post(url, data, headers) {
    return this.service({
      url,
      params: {
        access_token: this.token,
      },
      data,
      method: "post",
      headers,
    });
  }
}

module.exports = GiteeRequest;
