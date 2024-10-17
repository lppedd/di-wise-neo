import {describe, expect, it} from "vitest";

import {Container, Inject, Injectable, Scope, Scoped, Type} from "..";

describe("Features", () => {
  it("should handle circular dependencies", () => {
    const container = new Container();

    interface A {
      b: B;
    }
    interface B {
      a: A;
    }
    const A = Type<A>("A");
    const B = Type<B>("B");

    @Injectable(B)
    class BImpl {
      @Inject(A)
      a!: A;

      constructor() {
        expect(this.a).toBeDefined();
      }
    }

    @Injectable(A)
    class AImpl {
      @Inject(B)
      b!: B;

      constructor() {
        expect(this.b).toBeDefined();
      }
    }

    container.register(AImpl);
    container.register(BImpl);

    const a = container.resolve(A);
    expect(a).toBeInstanceOf(AImpl);
    const b = a.b;
    expect(b).toBeInstanceOf(BImpl);
    expect(b.a).toBe(a);
  });

  it("should handle resolution scope", () => {
    const container = new Container();

    @Scoped(Scope.Resolution)
    class A {}

    class B {
      @Inject(A)
      a!: A;
    }

    class C {
      @Inject(A)
      a!: A;

      @Inject(B)
      b!: B;
    }

    const c = container.resolve(C);
    expect(c.a).toBeInstanceOf(A);
    expect(c.b).toBeInstanceOf(B);
    expect(c.b.a).toBe(c.a);
  });

  it("should create child containers", () => {
    interface A {
      value: string;
    }
    const A = Type<A>("A");

    @Injectable(A)
    class AImpl implements A {
      value = "A";
    }

    const parent = new Container();
    parent.register(A, {
      useClass: AImpl,
    });

    const child = parent.createChild();
    expect(child.isRegistered(A)).toBe(true);

    const a = child.resolve(A);
    expect(a).toBeInstanceOf(AImpl);
  });

  it("should resolve multiple tokens", () => {
    const container = new Container();

    interface A {
      value: string;
    }
    const A = Type<A>("A");

    interface B {
      value: string;
    }
    const B = Type<B>("B");

    class C {
      @Inject(A, B)
      content!: {value: string};
    }

    container.register(B, {
      useValue: {value: "B"},
    });

    const c = container.resolve(C);
    expect(c.content.value).toBe("B");
  });
});
