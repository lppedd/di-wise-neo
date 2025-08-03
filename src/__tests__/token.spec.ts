import { describe, expect, it } from "vitest";

import { createType } from "..";
import { getTypeName } from "../utils/typeName";

describe("Type", () => {
  it("should create a unique token", () => {
    expect(createType("foo")).not.toBe(createType("foo"));
  });

  it("should have toString", () => {
    // eslint-disable-next-line @typescript-eslint/no-base-to-string
    expect(String(createType("foo"))).toBe("Type<foo>");
  });

  it("should have the correct string representation", () => {
    expect(getTypeName(null)).toBe("null");
    expect(getTypeName(undefined)).toBe("undefined");
    expect(getTypeName("myString")).toBe('"myString"');
    expect(getTypeName(function MyFunction() {})).toBe("typeof MyFunction");
    expect(getTypeName(() => {})).toBe("Function");

    class MyClass {}
    expect(getTypeName(new MyClass())).toBe("MyClass");
  });
});
