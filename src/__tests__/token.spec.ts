import { describe, expect, it } from "vitest";

import { Type } from "..";

describe("Type", () => {
  it("should create a unique token", () => {
    expect(Type("foo")).not.toBe(Type("foo"));
  });

  it("should have toString", () => {
    // eslint-disable-next-line @typescript-eslint/no-base-to-string
    expect(String(Type("foo"))).toBe("Type<foo>");
  });
});
