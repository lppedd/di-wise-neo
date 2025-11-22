import { describe, expect, it } from "vitest";

import { createType } from "..";
import { getTypeName } from "../utils/typeName";

describe("Type", () => {
  it("should create a unique token", () => {
    expect(createType("foo")).not.toBe(createType("foo"));
  });

  it("should have toString", () => {
    expect(String(createType("foo"))).toBe("Type<foo>");
    expect(createType("bar").toString()).toBe("Type<bar>");
    expect(createType("baz", { useValue: "bar" }).toString()).toBe("Type<baz>");
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
