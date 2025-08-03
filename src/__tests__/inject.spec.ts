// noinspection JSUnusedGlobalSymbols
/* eslint-disable no-use-before-define */

import { afterEach, describe, expect, it, vi } from "vitest";

import { AutoRegister, build, createContainer, Inject, inject, injectAll, injectBy, Injector, Optional, Scope, Scoped } from "..";
import { useInjectionContext } from "../injectionContext";
import { optional, optionalBy } from "../optional";

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
      `[Error: [di-wise-neo] circular dependency detected]`,
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
      `[Error: [di-wise-neo] circular dependency detected]`,
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

    it("should have context of the dependent", () => {
      const container = createContainer({
        autoRegister: true,
      });

      class Wand {
        owner = inject(Wizard);
      }

      @Scoped(Scope.Container)
      class Wizard {
        injector = injectBy(this, Injector);
      }

      const wizard = container.resolve(Wizard);
      const wand = wizard.injector.inject(Wand);
      expect(wand.owner).toBe(wizard);
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
  });
});
