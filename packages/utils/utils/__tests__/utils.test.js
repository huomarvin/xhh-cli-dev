"use strict";

const { isObject } = require("..");

describe("@xhh-cli-dev/utils", () => {
  it("needs tests", () => {
    expect(isObject({})).toBeTruth();
    expect(isObject([])).toBeFalseth();
  });
});
