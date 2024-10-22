import {afterEach, describe, expect, it, vi} from "vitest";

import {Container, Inject, inject, injectAll} from "..";

describe("inject", () => {
  const container = new Container();

  afterEach(() => {
    container.resetRegistry();
  });

  it("should error if outside context", () => {
    vi.useFakeTimers();

    class Wand {}

    expect(() => {
      container.resolve(class Wizard {
        constructor() {
          setTimeout(() => inject(Wand));
        }
      });
      vi.runAllTimers();
    }).toThrowErrorMatchingInlineSnapshot(
      `[Error: inject() can only be used within an injection context]`,
    );

    expect(() => {
      container.resolve(class Wizard {
        constructor() {
          setTimeout(() => inject.by(Wand));
        }
      });
      vi.runAllTimers();
    }).toThrowErrorMatchingInlineSnapshot(
      `[Error: injectBy() can only be used within an injection context]`,
    );

    expect(() => {
      container.resolve(class Wizard {
        constructor() {
          setTimeout(() => injectAll(Wand));
        }
      });
      vi.runAllTimers();
    }).toThrowErrorMatchingInlineSnapshot(
      `[Error: injectAll() can only be used within an injection context]`,
    );

    vi.restoreAllMocks();
  });

  it("should handle circular dependencies", () => {
    class Wand {
      owner = inject(Wizard);
    }

    class Wizard {
      wand1 = inject.by(this, Wand);

      @Inject(Wand)
      wand2!: Wand;
    }

    const wizard = container.resolve(Wizard);
    expect(wizard.wand1.owner).toBe(wizard);
    expect(wizard.wand2.owner).toBe(wizard);
  });
});
