/* eslint-disable no-use-before-define */

import { afterEach, describe, expect, it, vi } from "vitest";

import { Build, createContainer, Inject, inject, injectAll, injectBy, Injector, Scope, Scoped } from "..";
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
      container.resolve(
        class Wizard {
          constructor() {
            setTimeout(() => inject(Wand));
          }
        },
      );
      vi.runAllTimers();
    }).toThrowErrorMatchingInlineSnapshot(
      `[Error: [di-wise] inject() can only be invoked within an injection context]`,
    );

    expect(() => {
      container.resolve(
        class Wizard {
          constructor() {
            setTimeout(() => injectBy(Wand));
          }
        },
      );
      vi.runAllTimers();
    }).toThrowErrorMatchingInlineSnapshot(
      `[Error: [di-wise] injectBy() can only be invoked within an injection context]`,
    );

    expect(() => {
      container.resolve(
        class Wizard {
          constructor() {
            setTimeout(() => injectAll(Wand));
          }
        },
      );
      vi.runAllTimers();
    }).toThrowErrorMatchingInlineSnapshot(
      `[Error: [di-wise] injectAll() can only be invoked within an injection context]`,
    );

    vi.restoreAllMocks();
  });

  it("should handle circular dependencies", () => {
    class Wand {
      owner = inject(Wizard);
    }

    class Wizard {
      wand1 = injectBy(this, Wand);

      @Inject(Wand)
      wand2!: Wand;
    }

    const wizard = container.resolve(Wizard);
    expect(wizard.wand1.owner).toBe(wizard);
    expect(wizard.wand2.owner).toBe(wizard);
  });

  it("should fallback to inject if no dependent", () => {
    class Wand {
      owner = inject(Wizard);
    }

    class Wizard {
      wand = injectBy(this, Wand);
    }

    expect(() => container.resolve(Build(() => new Wizard()))).toThrowErrorMatchingInlineSnapshot(
      `[Error: [di-wise] circular dependency detected]`,
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

      const wizard = container.resolve(Wizard);
      expect(wizard.injector.inject(Wand)).toBeInstanceOf(Wand);
      expect(wizard.injector.injectAll(Wand)).toEqual([new Wand()]);
    });

    it("should use current context", () => {
      class Wizard {
        injector = inject(Injector);

        context = inject(Build(useInjectionContext));

        constructor() {
          this.injector.inject(
            Build(() => {
              expect(useInjectionContext()).toBe(this.context);
            }),
          );
        }
      }

      container.resolve(Wizard);
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
  });
});
