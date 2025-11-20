// noinspection JSUnusedGlobalSymbols
/* eslint-disable no-use-before-define */

import { afterEach, describe, expect, it, vi } from "vitest";

import {
  assertInjectionContext,
  AutoRegister,
  build,
  createContainer,
  Inject,
  inject,
  injectAll,
  injectBy,
  Injector,
  Optional,
  optional,
  optionalBy,
  Scope,
  Scoped
} from "..";
import { useInjectionContext } from "../injectionContext";

describe("inject", () => {
  const container = createContainer();

  afterEach(() => {
    container.resetRegistry();
  });

  it("should error if outside context", () => {
    vi.useFakeTimers();

    class Wand {}

    expect(() => {
      class Wizard {
        constructor() {
          setTimeout(() => inject(Wand));
        }
      }

      container.register(Wizard).resolve(Wizard);
      vi.runAllTimers();
    }).toThrowErrorMatchingInlineSnapshot(`[Error: [di-wise-neo] inject() can only be invoked within an injection context]`);

    expect(() => {
      class Wizard {
        constructor() {
          setTimeout(() => injectBy(Wand, Wand));
        }
      }

      container.register(Wizard).resolve(Wizard);
      vi.runAllTimers();
    }).toThrowErrorMatchingInlineSnapshot(`[Error: [di-wise-neo] injectBy() can only be invoked within an injection context]`);

    expect(() => {
      class Wizard {
        constructor() {
          setTimeout(() => injectAll(Wand));
        }
      }

      container.register(Wizard).resolve(Wizard);
      vi.runAllTimers();
    }).toThrowErrorMatchingInlineSnapshot(`[Error: [di-wise-neo] injectAll() can only be invoked within an injection context]`);

    expect(() => {
      const myFun = (): void => assertInjectionContext(myFun);
      myFun();
    }).toThrowErrorMatchingInlineSnapshot(`[Error: [di-wise-neo] myFun() can only be invoked within an injection context]`);

    expect(() => {
      const injector = container.resolve(Injector);
      injector.runInContext(() => assertInjectionContext("arrow function"));
    }).not.toThrow();

    vi.restoreAllMocks();
  });

  it("should handle circular dependencies with injectBy and @Inject", () => {
    class Wand {
      owner = inject(Wizard);
    }

    class Wizard {
      wand1 = injectBy(this, Wand);
      wand2!: Wand;

      setWand(@Inject(Wand) wand: Wand): void {
        this.wand2 = wand;
      }
    }

    container.register(Wand);
    container.register(Wizard);

    const wizard = container.resolve(Wizard);
    expect(wizard.wand1.owner).toBe(wizard);
    expect(wizard.wand2.owner).toBe(wizard);
  });

  it("should handle circular dependencies with optionalBy and @Optional", () => {
    class Wand {
      owner = optional(Wizard);
    }

    class Wizard {
      wand1 = optionalBy(this, Wand);
      wand2?: Wand;

      setWand(@Optional(Wand) wand?: Wand): void {
        this.wand2 = wand;
      }
    }

    container.register(Wand);
    container.register(Wizard);

    const wizard = container.resolve(Wizard);
    expect(wizard.wand1?.owner).toBe(wizard);
    expect(wizard.wand2?.owner).toBe(wizard);
  });

  it("should fallback to inject if no dependent", () => {
    @AutoRegister()
    class Wand {
      owner = inject(Wizard);
    }

    @AutoRegister()
    class Wizard {
      wand = injectBy(this, Wand);
    }

    expect(() => container.resolve(build(() => new Wizard()))).toThrowErrorMatchingInlineSnapshot(
      `
      [Error: [di-wise-neo] failed to resolve token Type<Build<Function>>
        [cause] failed to resolve token Wand
        [cause] failed to resolve token Wizard
        [cause] failed to resolve token Wand
        [cause] circular dependency detected while resolving Type<Build<Function>> → Wand → Wizard → Wand]
      `,
    );
  });

  it("should fallback to optional if no dependent", () => {
    class Wand {
      owner = optional(Wizard);
    }

    class Wizard {
      wand = optionalBy(this, Wand);
    }

    container.register(Wand);
    container.register(Wizard);

    expect(() => container.resolve(build(() => new Wizard()))).toThrowErrorMatchingInlineSnapshot(
      `
      [Error: [di-wise-neo] failed to resolve token Type<Build<Function>>
        [cause] failed to resolve token Wand
        [cause] failed to resolve token Wizard
        [cause] failed to resolve token Wand
        [cause] circular dependency detected while resolving Type<Build<Function>> → Wand → Wizard → Wand]
      `,
    );
  });

  describe("Injector", () => {
    it("should inject injector", () => {
      class Wizard {
        injector = inject(Injector);
      }

      class Wand {
        name = "Elder Wand";
      }

      container.register(Wizard);
      container.register(Wand);

      const wizard = container.resolve(Wizard);
      expect(wizard.injector.inject(Wand)).toBeInstanceOf(Wand);
      expect(wizard.injector.injectAll(Wand)).toEqual([new Wand()]);
    });

    it("should use current context", () => {
      class Wizard {
        injector = inject(Injector);
        context = inject(build(useInjectionContext));

        constructor() {
          this.injector.inject(
            build(() => {
              expect(useInjectionContext()).toBe(this.context);
            }),
          );
        }
      }

      container.register(Wizard).resolve(Wizard);
    });

    it("should resolve resolution scoped dependencies", () => {
      const container = createContainer({
        autoRegister: true,
      });

      @Scoped(Scope.Resolution)
      class Realm {}

      @Scoped(Scope.Container)
      class Wand {
        realm = inject(Realm);
        owner = inject(Wizard);
      }

      @Scoped(Scope.Container)
      class Wizard {
        realm = inject(Realm);
        injector = injectBy(this, Injector);
      }

      const wizard = container.resolve(Wizard);
      const wand = wizard.injector.inject(Wand);
      expect(wand.owner).toBe(wizard);
      expect(wand.realm).toBe(wizard.realm);
      expect(wand.realm).not.toBe(container.resolve(Realm));
      expect(container.resolve(Realm)).not.toBe(container.resolve(Realm));
      expect(container.getCached(Wand)).toBe(wand);
    });

    it("should support runInContext", () => {
      @AutoRegister()
      @Scoped(Scope.Container)
      class Wizard {}

      const injector = container.resolve(Injector);
      const wizard = injector.runInContext(() => optional(Wizard));
      expect(wizard).not.toBeUndefined();
      expect(wizard).toBe(container.resolve(Wizard));
    });

    it("should not throw a circular dependency error", () => {
      class Wizard {
        injector = inject(Injector);

        getWand(): Wand {
          return this.injector.inject(Wand);
        }
      }

      @Scoped(Scope.Container)
      class Wand {
        wizard = inject(Wizard);
      }

      container.register(Wizard);
      container.register(Wand);

      const wizard = container.resolve(Wizard);
      const wand = wizard.getWand();
      expect(wand.wizard).toBeInstanceOf(Wizard);
    });
  });
});
