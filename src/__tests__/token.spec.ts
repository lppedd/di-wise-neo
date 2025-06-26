import { describe, expect, it } from "vitest";

import { createType } from "..";

describe("Type", () => {
  it("should create a unique token", () => {
    expect(createType("foo")).not.toBe(createType("foo"));
  });

  it("should have toString", () => {
    // eslint-disable-next-line @typescript-eslint/no-base-to-string
    expect(String(createType("foo"))).toBe("Type<foo>");
  });
});
