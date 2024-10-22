import {describe, expect, it} from "vitest";

import {Type, Value} from "..";

describe("Type", () => {
  it("should create a unique token", () => {
    expect(Type("foo")).not.toBe(Type("foo"));
  });

  it("should have toString", () => {
    expect(String(Type("foo"))).toBe("Type<foo>");
  });

  describe("Value", () => {
    it("should get type of string", () => {
      expect(String(Value("foo"))).toBe("Type<Value<\"foo\">>");
    });

    it("should get type of named function", () => {
      function foo() {}
      expect(String(Value(foo))).toBe("Type<Value<typeof foo>>");
    });

    it("should get type of anonymous function", () => {
      expect(String(Value(() => {}))).toBe("Type<Value<Function>>");
    });

    it("should get type of null", () => {
      expect(String(Value(null))).toBe("Type<Value<null>>");
    });

    it("should get type of object", () => {
      expect(String(Value({}))).toBe("Type<Value<Object>>");
    });

    it("should get type of null prototype", () => {
      expect(String(Value(Object.create(null)))).toBe("Type<Value<Object>>");
    });

    it("should get type of named class", () => {
      class Foo {}
      expect(String(Value(new Foo()))).toBe("Type<Value<Foo>>");
    });

    it("should get type of anonymous class", () => {
      expect(String(Value(new class {}()))).toBe("Type<Value<(anonymous)>>");
    });

    it("should get type of boolean", () => {
      expect(String(Value(true))).toBe("Type<Value<boolean>>");
    });

    it("should get type of number", () => {
      expect(String(Value(1))).toBe("Type<Value<number>>");
    });

    it("should get type of symbol", () => {
      expect(String(Value(Symbol()))).toBe("Type<Value<symbol>>");
    });

    it("should get type of undefined", () => {
      expect(String(Value(undefined))).toBe("Type<Value<undefined>>");
    });
  });
});
