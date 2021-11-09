const ws = require("ws");

const TIME_OUT = 5 * 60;
const WS_URL = "ws://localhost:8080/";
class CloudBuild {
  constructor(git, options) {
    this.git = git;
    this.buildCmd = options.buildCmd;
    this.socket = null;
  }
  init() {
    this.socket = new ws(WS_URL);
    this.socket.on("open", function () {
      console.log("connect success !!!");
    });
    this.socket.on("error", function (err) {
      console.log("error: ", err);
    });

    this.socket.on("close", function () {
      console.log("close");
    });

    this.socket.on("message", function (data) {
      console.log(data.toString());
    });
  }
}

// // socket.on("events", (msg) => {
// //   console.log(msg);
// // });
module.exports = CloudBuild;
// var ws = require("ws");
// // url ws://127.0.0.1:6080
// // 创建了一个客户端的socket,然后让这个客户端去连接服务器的socket
// var sock = new ws("ws://localhost:8080/");
// sock.on("open", function () {
//   console.log("connect success !!!!");
//   sock.send(JSON.stringify({ event: "events", data: "test" }));
// });

// sock.on("error", function (err) {
//   console.log("error: ", err);
// });

// sock.on("close", function () {
//   console.log("close");
// });

// sock.on("message", function (data) {
//   console.log(data.toString());
// });
