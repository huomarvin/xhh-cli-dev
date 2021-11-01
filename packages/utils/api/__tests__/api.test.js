"use strict";

const { getCommands } = require("../lib/lib");

describe("api", async () => {
  const commands = getCommands();
  console.log(commands);
});
