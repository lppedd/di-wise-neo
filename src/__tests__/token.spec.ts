import {describe, expect, it} from "vitest";

import {Type, Value} from "..";

describe("Type", () => {
  it("should create a unique token", () => {
    expect(Type("foo")).not.toBe(Type("foo"));
  });

  it("should have toString", () => {
    // eslint-disable-next-line @typescript-eslint/no-base-to-string
    expect(String(Type("foo"))).toBe("Type<foo>");
  });

  describe("Value", () => {
    it("should get type of string", () => {
      expect(Value("foo")).toMatchObject({name: "Type<Value<\"foo\">>"});
    });

    it("should get type of named function", () => {
      function foo() {}
      expect(Value(foo)).toMatchObject({name: "Type<Value<typeof foo>>"});
    });

    it("should get type of anonymous function", () => {
      expect(Value(() => {})).toMatchObject({name: "Type<Value<Function>>"});
    });

    it("should get type of null", () => {
      expect(Value(null)).toMatchObject({name: "Type<Value<null>>"});
    });

    it("should get type of object", () => {
      expect(Value({})).toMatchObject({name: "Type<Value<object>>"});
    });

    it("should get type of null prototype", () => {
      expect(Value(Object.create(null))).toMatchObject({name: "Type<Value<object>>"});
    });

    it("should get type of named class", () => {
      class Foo {}
      expect(Value(new Foo())).toMatchObject({name: "Type<Value<Foo>>"});
    });

    it("should get type of anonymous class", () => {
      expect(Value(new class {}())).toMatchObject({name: "Type<Value<object>>"});
    });

    it("should get type of boolean", () => {
      expect(Value(true)).toMatchObject({name: "Type<Value<boolean>>"});
    });

    it("should get type of number", () => {
      expect(Value(1)).toMatchObject({name: "Type<Value<number>>"});
    });

    it("should get type of symbol", () => {
      expect(Value(Symbol())).toMatchObject({name: "Type<Value<symbol>>"});
    });

    it("should get type of undefined", () => {
      expect(Value(undefined)).toMatchObject({name: "Type<Value<undefined>>"});
    });
  });
});
