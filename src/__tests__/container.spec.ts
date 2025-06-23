import { afterEach, describe, expect, it } from "vitest";

import {
  AutoRegister,
  Build,
  createContainer,
  inject,
  Injectable,
  InjectAll,
  Scope,
  Scoped,
  Type,
  Value,
} from "..";
import { useInjectionContext } from "../injectionContext";
import { TypeNull, TypeUndefined } from "../token";

describe("Container", () => {
  const container = createContainer();

  afterEach(() => {
    container.resetRegistry();
  });

  it("should handle hierarchical injection", () => {
    const parent = createContainer({
      defaultScope: Scope.Container,
    });

    const Env = Type<string>("Env");
    class Wizard {
      count = 0;
    }

    parent.register(Env, { useValue: "production" });
    parent.register(Wizard);

    const child = parent.createChild();
    expect(child.isRegistered(Env)).toBe(true);
    expect(child.resolve(Env)).toBe("production");
    expect(child.resolveAll(Env)).toEqual(["production"]);

    const wizardInstance = child.resolve(Wizard);
    wizardInstance.count++;

    expect(wizardInstance).toBeInstanceOf(Wizard);
    expect(wizardInstance).toBe(parent.resolve(Wizard));

    // Verify the child-parent relationship
    expect(child.getParent()).toBe(parent);
  });

  it("should get the cached values but keep the registrations", () => {
    @Scoped(Scope.Container)
    class Wizard {}

    // Purposedly register two Wizard(s)
    container.register(Wizard);
    container.register(Wizard);

    // Resolve all Wizard(s) so the values are cached
    const wizards = container.resolveAll(Wizard);
    expect(wizards).toHaveLength(2);

    // The cached value should be the value for the last registration
    expect(container.getCached(Wizard)).toBe(wizards[1]);

    // We should now have two cached instances for the two registrations
    const cachedWizards = container.getAllCached(Wizard);
    expect(cachedWizards).toHaveLength(2);

    // The cached values are returned in registration order
    expect(cachedWizards[0]).toBe(wizards[0]);
    expect(cachedWizards[1]).toBe(wizards[1]);

    container.clearCache();

    expect(container.isRegistered(Wizard)).toBe(true);
    expect(container.getCached(Wizard)).toBeUndefined();
    expect(container.getAllCached(Wizard)).toEqual([]);

    // Since the cached values have been cleared, new instances are created
    expect(container.resolve(Wizard)).not.toBe(wizards[1]);

    // An empty array should be returned for unregistered tokens
    container.unregister(Wizard);
    expect(container.getAllCached(Wizard)).toEqual([]);
  });

  it("should get primitive cached values", () => {
    const Env = Type<string>("Env");
    const Port = Type<number>("Port");
    const Null = Type<null>("Undefined");

    container.register(Env, { useFactory: () => "" }, { scope: Scope.Container });
    container.register(Port, { useFactory: () => 0 }, { scope: Scope.Container });
    container.register(Null, { useFactory: () => null }, { scope: Scope.Container });

    expect(container.resolve(Env)).toBe("");
    expect(container.resolve(Port)).toBe(0);
    expect(container.resolve(Null)).toBe(null);

    expect(container.getCached(Env)).toBe("");
    expect(container.getCached(Port)).toBe(0);
    expect(container.getCached(Null)).toBe(null);

    expect(container.getAllCached(Port)).toEqual([0]);
    expect(container.getAllCached(Env)).toEqual([""]);
    expect(container.getAllCached(Null)).toEqual([null]);
  });

  it("should reset registry", () => {
    const container = createContainer({
      defaultScope: Scope.Container,
      autoRegister: true,
    });

    class Wizard {}

    const wizard = container.resolve(Wizard);
    expect(container.resolve(Wizard)).toBe(wizard);

    container.resetRegistry();
    expect(container.isRegistered(Wizard)).toBe(false);
    expect(container.resolve(Wizard)).not.toBe(wizard);
  });

  it("should register all tokens", () => {
    const Character = Type<{}>("Character");
    const Dumbledore = Type<{}>("Dumbledore");

    @Injectable(Character, Dumbledore)
    @Scoped(Scope.Container)
    class Wizard {}

    container.register(Wizard);

    expect(container.isRegistered(Character)).toBe(true);
    expect(container.isRegistered(Dumbledore)).toBe(true);
    expect(container.isRegistered(Wizard)).toBe(true);

    // Since Wizard has been registered as a singleton, the Character token
    // which is being used as an alias should resolve to the same instance
    expect(container.resolve(Wizard)).toBe(container.resolve(Character));
    expect(container.resolve(Wizard)).toBe(container.resolve(Dumbledore));
  });

  it("should throw error when a token is passed multiple times to @Injectable", () => {
    expect(() => {
      const Character = Type<{}>("Character");

      @Injectable(Character, Character)
      @Scoped(Scope.Container) // eslint-disable-next-line @typescript-eslint/no-unused-vars
      class Wizard {}
    }).toThrowErrorMatchingInlineSnapshot(
      `[Error: [di-wise] token Type<Character> must be passed exactly once to @Injectable]`,
    );
  });

  it("should use the same provider for the same class", () => {
    const Character = Type<{}>("Character");
    const Hero = Type<{}>("Hero");

    class Wizard {}

    container.register(Character, { useClass: Wizard });
    container.register(Hero, { useClass: Wizard });

    const characterRegistration = container.registry.get(Character)!;
    const heroRegistration = container.registry.get(Hero)!;
    expect(characterRegistration.provider).toBe(heroRegistration.provider);
  });

  it("should perform constructor injection using inject", () => {
    @AutoRegister()
    class Wand {}

    @AutoRegister()
    class Wizard {
      constructor(readonly wand = inject(Wand)) {}
    }

    const wizardInstance = container.resolve(Wizard);
    expect(wizardInstance).toBeInstanceOf(Wizard);
    expect(wizardInstance.wand).toBeInstanceOf(Wand);
  });

  it("should get the options from the class", () => {
    @Scoped(Scope.Container)
    @AutoRegister()
    class Wizard {}

    container.resolve(Wizard);
    const registration = container.registry.get(Wizard)!;
    expect(registration.options?.scope).toBe(Scope.Container);
  });

  it("should override the options on re-register", () => {
    @Scoped(Scope.Container)
    class Wizard {}

    container.register(Wizard, { useClass: Wizard });

    container.register(Wizard, { useClass: Wizard }, { scope: Scope.Transient });

    const registration = container.registry.get(Wizard)!;
    expect(registration.options?.scope).toBe(Scope.Transient);
  });

  it("should unregister tokens", () => {
    const Env = Type<string>("Env");

    @Scoped(Scope.Container)
    class Product {
      env = inject(Env);
    }

    // Unregistering an unregistered token should simply return an empty array
    expect(container.unregister(Env)).toEqual([]);

    container.register(Env, { useValue: "production" });
    container.register(Product, { useClass: Product });

    expect(container.isRegistered(Env)).toBe(true);
    expect(container.isRegistered(Product)).toBe(true);
    expect(container.resolve(Product)).toBeInstanceOf(Product);

    // Values provided via ValueProvider are not returned
    expect(container.unregister(Env)).toEqual([]);

    const cachedValues = container.unregister(Product);
    expect(cachedValues).toHaveLength(1);
    expect(cachedValues[0]).toBeInstanceOf(Product);

    expect(container.isRegistered(Env)).toBe(false);
    expect(container.isRegistered(Product)).toBe(false);
  });

  it("should throw an error if unregistered class has container scope", () => {
    @Scoped(Scope.Container)
    class Wizard {}

    expect(() => container.resolve(Wizard)).toThrowErrorMatchingInlineSnapshot(
      `[Error: [di-wise] unregistered class Wizard cannot be resolved in container scope]`,
    );
    expect(() => container.resolveAll(Wizard)).toThrowErrorMatchingInlineSnapshot(
      `[Error: [di-wise] unregistered class Wizard cannot be resolved in container scope]`,
    );
  });

  it("should throw error when the token is not registered", () => {
    const Env = Type<string>("Env");

    expect(() => container.resolve(Env)).toThrowErrorMatchingInlineSnapshot(
      `[Error: [di-wise] unregistered token(s) Type<Env>]`,
    );

    expect(container.resolveAll(Env)).toEqual([]);
  });

  it("should resolve all tokens", () => {
    const Character = Type<{ name: string }>("Character");

    @Injectable(Character)
    class Wizard {
      name = "Wizard";
    }

    @Injectable(Character)
    class Witch {
      name = "Witch";
    }

    container.register(Wizard);
    container.register(Witch);

    const characters = container.resolveAll(Character);
    expect(characters).toHaveLength(2);
    expect(characters.map(({ name }) => name)).toEqual(["Wizard", "Witch"]);
  });

  it("should resolve all tokens with a class fallback", () => {
    const container = createContainer({
      defaultScope: Scope.Container,
      autoRegister: true,
    });

    const Character = Type<{}>("Character");

    class Wizard {}

    expect(container.resolveAll(Character, Wizard)).toEqual([container.resolve(Wizard)]);
  });

  it("should return empty array if null or undefined is resolved", () => {
    const Character = Type<{}>("Character");
    expect(container.resolveAll(Character, TypeNull)).toEqual([]);
    expect(container.resolveAll(Character, TypeUndefined)).toEqual([]);
  });

  it("should resolve existing providers", () => {
    class Registered {}
    class NotRegistered {}
    class WizardImpl {}
    const Wizard = Type<WizardImpl>("Wizard");

    const container = createContainer({
      defaultScope: "Container",
    });

    container.register(Registered, { useExisting: NotRegistered });
    container.register(WizardImpl);

    // We should not be able to register a token pointing to itself,
    // as it would cause a circular dependency error
    expect(() => container.register(Wizard, { useExisting: Wizard })).toThrowError(
      "[di-wise] the useExisting token Type<Wizard> cannot be the same as the token being registered",
    );

    container.register(Wizard, { useExisting: WizardImpl });
    expect(container.resolve(WizardImpl)).toBe(container.resolve(Wizard));

    // When resolving a token using an ExistingProvider that points to an unregistered token,
    // the error should include the original cause
    expect(() => container.resolve(Registered)).toThrowErrorMatchingInlineSnapshot(
      `
      [Error: [di-wise] token resolution error encountered while resolving Registered
        [cause] unregistered class NotRegistered cannot be resolved in container scope]
      `,
    );

    // It is unclear to me how this should behave.
    // As of now, let's simply document the fact that a resolveAll call
    // to a registered token using an ExistingProvider pointing to a
    // non-registered token will throw an error.
    expect(() => container.resolveAll(Registered)).toThrowErrorMatchingInlineSnapshot(
      `
      [Error: [di-wise] token resolution error encountered while resolving Registered
        [cause] unregistered class NotRegistered cannot be resolved in container scope]
      `,
    );
  });

  it("should resolve factory providers", () => {
    class WizardImpl {}

    const Wizard = Type<WizardImpl>("Wizard");

    container.register(Wizard, { useFactory: () => new WizardImpl() });
    expect(container.resolve(Wizard)).toBeInstanceOf(WizardImpl);
  });

  it("should switch context", () => {
    const child = container.createChild();

    container.resolve(
      Build(() => {
        const context = useInjectionContext()!;

        child.resolve(
          Build(() => {
            const innerContext = useInjectionContext()!;
            expect(innerContext).not.toBe(context);
            expect(innerContext.container).toBe(child);
            expect(innerContext.resolution).not.toBe(context.resolution);
          }),
        );
      }),
    );
  });

  it("should throw error if no tokens are passed to resolve, resolveAll, @Injectable", () => {
    expect(() => {
      container.resolve();
    }).toThrowErrorMatchingInlineSnapshot(
      `[Error: [di-wise] at least one token must be provided for dependency resolution]`,
    );

    expect(() => {
      container.resolveAll();
    }).toThrowErrorMatchingInlineSnapshot(
      `[Error: [di-wise] at least one token must be provided for dependency resolution]`,
    );
  });

  it("should throw error if detected circular dependency", () => {
    class Wand {
      // eslint-disable-next-line no-use-before-define
      owner = inject(Wizard);
    }

    class Wizard {
      @InjectAll(Wand)
      wand!: Wand[];
    }

    expect(() => container.resolve(Wizard)).toThrowErrorMatchingInlineSnapshot(
      `[Error: [di-wise] circular dependency detected]`,
    );
  });

  it("should resolve resolution scoped providers", () => {
    @Scoped(Scope.Resolution)
    class Decoration {}

    class Wand {
      decoration = inject(Decoration);
    }

    class Wizard {
      wand = inject(Wand);
      decoration = inject(Decoration);
    }

    const wizard = container.resolve(Wizard);
    expect(wizard.wand.decoration).toBe(wizard.decoration);
  });

  it("should resolve a default value", () => {
    const Env = Type<string>("Env");
    const env = container.resolve(Env, Value("development"));
    expect(env).toBe("development");
  });

  it("should dispose itself and its registrations", () => {
    class Wand {
      calls = 0;

      dispose(): void {
        this.calls++;
      }
    }

    @Scoped(Scope.Container)
    class Wizard {
      calls = 0;
      wand = inject(Wand);

      dispose(): void {
        this.calls++;
      }
    }

    const container = createContainer();
    const wizardToken = Type<Wizard>("SecondaryWizard");
    container.register(
      wizardToken,
      { useFactory: () => inject(Wizard) },
      { scope: Scope.Container },
    );
    container.register(Wizard);
    container.register(Wand);

    const value = new Wand();
    const valueToken = Type<Wand>("ValueWand");
    container.register(valueToken, { useValue: value });

    const wizardInstance = container.resolve(Wizard);
    expect(wizardInstance).toBeInstanceOf(Wizard);
    expect(wizardInstance.wand).toBeInstanceOf(Wand);
    expect(wizardInstance).toBe(container.resolve(wizardToken));

    const child = container.createChild();
    child.register(Wand);

    container.dispose();

    expect(container.isDisposed).toBe(true);
    expect(child.isDisposed).toBe(true);
    expect(() => container.resolve(Wand)).toThrowError("[di-wise] the container is disposed");
    expect(() => child.resolve(Wand)).toThrowError("[di-wise] the container is disposed");

    expect(wizardInstance.calls).toBe(1);
    expect(wizardInstance.wand.calls).toBe(1);

    // Values provided via ValueProvider are not disposed by the container
    // and must manage their own lifecycle
    expect(value.calls).toBe(0);

    // We can call dispose as many times as we want
    container.dispose();
    container.dispose();
  });
});
