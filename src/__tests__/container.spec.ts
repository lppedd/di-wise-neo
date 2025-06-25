// noinspection JSUnusedGlobalSymbols,JSUnusedLocalSymbols
/* eslint-disable no-use-before-define */

import { afterEach, assert, describe, expect, it } from "vitest";

import {
  AutoRegister,
  Build,
  createContainer,
  forwardRef,
  Inject,
  inject,
  Injectable,
  InjectAll,
  injectAll,
  Optional,
  OptionalAll,
  Scope,
  Scoped,
  Type
} from "..";
import { useInjectionContext } from "../injectionContext";
import { optional } from "../optional";
import { optionalAll } from "../optionalAll";

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

    // We should now have two cached values for the two registrations
    const cachedWizards = container.getAllCached(Wizard);
    expect(cachedWizards).toHaveLength(2);

    // The cached values are returned in registration order
    expect(cachedWizards[0]).toBe(wizards[0]);
    expect(cachedWizards[1]).toBe(wizards[1]);

    container.clearCache();

    expect(container.isRegistered(Wizard)).toBe(true);
    expect(container.getCached(Wizard)).toBeUndefined();
    expect(container.getAllCached(Wizard)).toEqual([]);

    // Since the cached values have been cleared, new values are created
    expect(container.resolve(Wizard)).not.toBe(wizards[1]);

    // An empty array should be returned for unregistered tokens
    container.unregister(Wizard);
    expect(container.getAllCached(Wizard)).toEqual([]);
  });

  it("should get primitive cached values", () => {
    const Env = Type<string>("Env");
    const Port = Type<number>("Port");
    const Null = Type<null>("Null");
    const Undefined = Type<undefined>("Undefined");

    container.register(Env, { useFactory: () => "" }, { scope: Scope.Container });
    container.register(Port, { useFactory: () => 0 }, { scope: Scope.Container });
    container.register(Null, { useFactory: () => null }, { scope: Scope.Container });
    container.register(Undefined, { useFactory: () => undefined }, { scope: Scope.Container });

    expect(container.resolve(Env)).toBe("");
    expect(container.resolve(Port)).toBe(0);
    expect(container.resolve(Null)).toBeNull();
    expect(container.resolve(Undefined)).toBeUndefined();

    expect(container.getCached(Env)).toBe("");
    expect(container.getCached(Port)).toBe(0);
    expect(container.getCached(Null)).toBeNull();
    expect(container.getCached(Undefined)).toBeUndefined();

    expect(container.getAllCached(Port)).toStrictEqual([0]);
    expect(container.getAllCached(Env)).toStrictEqual([""]);
    expect(container.getAllCached(Null)).toStrictEqual([null]);
    expect(container.getAllCached(Undefined)).toStrictEqual([undefined]);
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

  it("should perform constructor injection using inject and injectAll", () => {
    @AutoRegister()
    class Wand {}

    @AutoRegister()
    class Wizard {
      constructor(
        readonly wand = inject(Wand),
        readonly wands = injectAll(Wand),
      ) {}
    }

    const wizardInstance = container.resolve(Wizard);
    expect(wizardInstance).toBeInstanceOf(Wizard);
    expect(wizardInstance.wand).toBeInstanceOf(Wand);
    expect(wizardInstance.wands).toHaveLength(1);
    expect(wizardInstance.wands[0]).toBeInstanceOf(Wand);
  });

  it("should perform constructor injection using optional and optionalAll", () => {
    @Scoped(Scope.Container)
    class Castle {}

    @AutoRegister()
    class Wand {}

    @AutoRegister()
    class Wizard {
      constructor(
        readonly castle = optional(Castle),
        readonly wand = optional(Wand),
        readonly wands = optionalAll(Wand),
      ) {}
    }

    const wizardInstance = container.resolve(Wizard);
    expect(wizardInstance).toBeInstanceOf(Wizard);
    expect(wizardInstance.castle).toBeUndefined();
    expect(wizardInstance.wand).toBeInstanceOf(Wand);
    expect(wizardInstance.wands).toHaveLength(1);
    expect(wizardInstance.wands[0]).toBeInstanceOf(Wand);
  });

  it("should perform constructor injection with @Inject and @InjectAll", () => {
    const Spell = Type<string>("Spell");

    @Scoped(Scope.Container)
    class Wizard {
      constructor(
        @Inject(Spell) readonly spell: string,
        @InjectAll(Spell) readonly spells: string[],
      ) {}
    }

    container.register(Spell, { useFactory: () => "spell one" });
    container.register(Spell, { useFactory: () => "spell two" });
    container.register(Wizard);

    expect(container.isRegistered(Spell)).toBe(true);
    expect(container.isRegistered(Wizard)).toBe(true);

    const wizardInstance = container.resolve(Wizard);
    expect(wizardInstance).toBeInstanceOf(Wizard);
    expect(wizardInstance.spell).toBe("spell two");

    assert(Array.isArray(wizardInstance.spells), "spells should be an array");
    expect(wizardInstance.spells).toHaveLength(2);
    expect(wizardInstance.spells[0]).toBe("spell one");
    expect(wizardInstance.spells[1]).toBe("spell two");
  });

  it("should perform constructor injection with @Optional and @OptionalAll", () => {
    const Spell = Type<string>("Spell");

    @Scoped(Scope.Container)
    class Wizard {
      constructor(
        @Optional(Spell) readonly spell: string | undefined,
        @OptionalAll(Spell) readonly spells: string[],
      ) {}
    }

    container.register(Wizard);

    expect(container.isRegistered(Spell)).toBe(false);
    expect(container.isRegistered(Wizard)).toBe(true);

    const wizardInstance = container.resolve(Wizard);
    expect(wizardInstance).toBeInstanceOf(Wizard);
    expect(wizardInstance.spell).toBeUndefined();

    assert(Array.isArray(wizardInstance.spells), "spells should be an array");
    expect(wizardInstance.spells).toHaveLength(0);
  });

  it("should perform method injection with @Inject and @InjectAll", () => {
    class Castle {}

    @Scoped(Scope.Container)
    class Wizard {
      castle!: Castle;
      wand!: Wand;
      wands!: Wand[];

      setCastle(@Inject(Castle) castle: Castle): void {
        this.castle = castle;
      }

      setWand(@Inject(forwardRef(() => Wand)) wand: Wand): void {
        this.wand = wand;
      }

      setWands(@InjectAll(forwardRef(() => Wand)) wands: Wand[]): void {
        this.wands = wands;
      }
    }

    class Wand {
      constructor(readonly name: string) {}
    }

    const wandOne = new Wand("one");
    const wandTwo = new Wand("two");
    container.register(Castle);
    container.register(Wand, { useValue: wandOne });
    container.register(Wand, { useValue: wandTwo });
    container.register(Wizard);

    expect(container.isRegistered(Castle)).toBe(true);
    expect(container.isRegistered(Wand)).toBe(true);
    expect(container.isRegistered(Wizard)).toBe(true);

    const wizardInstance = container.resolve(Wizard);
    expect(wizardInstance).toBeInstanceOf(Wizard);
    expect(wizardInstance.castle).toBeInstanceOf(Castle);
    expect(wizardInstance.wand).toBe(wandTwo);
    expect(wizardInstance.wands).toHaveLength(2);
    expect(wizardInstance.wands[0]).toBe(wandOne);
    expect(wizardInstance.wands[1]).toBe(wandTwo);
  });

  it("should perform method injection with @Optional and @OptionalAll", () => {
    // Caste will inherit the scope from Wizard, and thus it won't be
    // instantiated one-off by the container
    class Castle {}

    @Scoped(Scope.Container)
    class Wizard {
      castle?: Castle;
      wands?: Wand[];

      setCastle(@Optional(Castle) castle?: Castle): void {
        this.castle = castle;
      }

      setWands(@OptionalAll(forwardRef(() => Wand)) wands: Wand[]): void {
        this.wands = wands;
      }
    }

    class Wand {
      constructor(readonly name: string) {}
    }

    const wand = new Wand("one");
    container.register(Wand, { useValue: wand });
    container.register(Wizard);

    expect(container.isRegistered(Castle)).toBe(false);
    expect(container.isRegistered(Wand)).toBe(true);
    expect(container.isRegistered(Wizard)).toBe(true);

    const wizardInstance = container.resolve(Wizard);
    expect(wizardInstance).toBeInstanceOf(Wizard);
    expect(wizardInstance.castle).toBeUndefined();
    expect(wizardInstance.wands).toHaveLength(1);
    expect(wizardInstance.wands![0]).toBe(wand);
  });

  it("should throw when @Inject is applied to static methods", () => {
    expect(() => {
      const Wand = Type<string>("Wand");

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      class Wizard {
        static setWand(@Inject(Wand) _wand: string): void {}
      }
    }).toThrowErrorMatchingInlineSnapshot(
      `[Error: [di-wise] @Inject cannot be used on static member Wizard.setWand]`,
    );
  });

  it("should throw when @Optional is applied to static methods", () => {
    expect(() => {
      const Wand = Type<string>("Wand");

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      class Wizard {
        static setWand(@Optional(Wand) _wand: string | undefined): void {}
      }
    }).toThrowErrorMatchingInlineSnapshot(
      `[Error: [di-wise] @Optional cannot be used on static member Wizard.setWand]`,
    );
  });

  it("should throw when @InjectAll is applied to static methods", () => {
    expect(() => {
      const Wand = Type<string>("Wand");

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      class Wizard {
        static setWands(@InjectAll(Wand) _wands: string[]): void {}
      }
    }).toThrowErrorMatchingInlineSnapshot(
      `[Error: [di-wise] @InjectAll cannot be used on static member Wizard.setWands]`,
    );
  });

  it("should throw when @OptionalAll is applied to static methods", () => {
    expect(() => {
      const Wand = Type<string>("Wand");

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      class Wizard {
        static setWands(@OptionalAll(Wand) _wands: string[]): void {}
      }
    }).toThrowErrorMatchingInlineSnapshot(
      `[Error: [di-wise] @OptionalAll cannot be used on static member Wizard.setWands]`,
    );
  });

  it("should throw when not all constructor params are decorated with @Inject", () => {
    expect(() => {
      class Wand {}

      @AutoRegister()
      class Wizard {
        constructor(
          @Inject(Wand) readonly wand: Wand,
          private spell: string,
          private name: string = "My Name",
        ) {}
      }

      container.resolve(Wizard);
    }).toThrowErrorMatchingInlineSnapshot(
      `[Error: [di-wise] expected 2 decorated constructor parameters in Wizard, but found 1]`,
    );
  });

  it("should throw when not all constructor params are decorated with @Inject/@InjectAll", () => {
    expect(() => {
      class Wand {}

      @AutoRegister()
      class Wizard {
        constructor(
          @InjectAll(Wand) readonly wands: Wand[],
          @Inject(Wand) readonly wand: Wand,
          private spell: string,
        ) {}
      }

      container.resolve(Wizard);
    }).toThrowErrorMatchingInlineSnapshot(
      `[Error: [di-wise] expected 3 decorated constructor parameters in Wizard, but found 2]`,
    );
  });

  it("should throw when not all constructor params are decorated with @Optional/@OptionalAll", () => {
    expect(() => {
      class Wand {}

      @AutoRegister()
      class Wizard {
        constructor(
          @OptionalAll(Wand) readonly wands: Wand[],
          @Optional(Wand) readonly wand: Wand,
          private spell: string,
        ) {}
      }

      container.resolve(Wizard);
    }).toThrowErrorMatchingInlineSnapshot(
      `[Error: [di-wise] expected 3 decorated constructor parameters in Wizard, but found 2]`,
    );
  });

  it("should throw when not all method params are decorated with @Inject/@InjectAll", () => {
    expect(() => {
      class Wand {}
      class Spell {}

      @AutoRegister()
      class Wizard {
        set(@Inject(Wand) _wand: Wand, @InjectAll(Spell) _spells: Spell[], _other: string): void {}
      }

      container.resolve(Wizard);
    }).toThrowErrorMatchingInlineSnapshot(
      `[Error: [di-wise] expected 3 decorated method parameters in Wizard.set, but found 2]`,
    );
  });

  it("should throw when not all method params are decorated with @Optional/@OptionalAll", () => {
    expect(() => {
      class Wand {}
      class Spell {}

      @AutoRegister()
      class Wizard {
        set(@Optional(Wand) _wand: Wand, @OptionalAll(Spell) _spells: Spell[], _other: string): void {}
      }

      container.resolve(Wizard);
    }).toThrowErrorMatchingInlineSnapshot(
      `[Error: [di-wise] expected 3 decorated method parameters in Wizard.set, but found 2]`,
    );
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
      `[Error: [di-wise] unregistered token Type<Env>]`,
    );

    expect(() => container.resolveAll(Env)).toThrowErrorMatchingInlineSnapshot(
      `[Error: [di-wise] unregistered token Type<Env>]`,
    );
  });

  it("should resolve all tokens", () => {
    const Character = Type<{ name: string }>("Person");

    @Injectable(Character)
    class Wizard {
      name = "Wizard";
    }

    // Injectable decorators can be stacked
    @Injectable(forwardRef(() => Person))
    @Injectable(forwardRef(() => [Character]))
    class Witch {
      name = "Witch";
    }

    const Person = Type<{ name: string }>("Character");

    container.register(Wizard);
    container.register(Witch);

    const persons = container.resolveAll(Person);
    expect(persons).toHaveLength(1);
    expect(persons[0]!.name).toBe("Witch");

    const characters = container.resolveAll(Character);
    expect(characters).toHaveLength(2);
    expect(characters.map(({ name }) => name)).toEqual(["Wizard", "Witch"]);
  });

  it("should resolve auto-registered classes", () => {
    const container = createContainer({
      defaultScope: Scope.Container,
      autoRegister: true,
    });

    class Wizard {}

    expect(container.resolveAll(Wizard)).toEqual([container.resolve(Wizard)]);
  });

  it("should return empty array if resolution is optional", () => {
    @Scoped(Scope.Container)
    class Character {}
    expect(container.resolveAll(Character, true)).toEqual([]);
  });

  it("should resolve existing providers", () => {
    @Scoped(Scope.Container)
    class WizardImpl {}
    const Wizard = Type<WizardImpl>("Wizard");

    container.register(WizardImpl);

    // We should not be able to register a token pointing to itself,
    // as it would cause a circular dependency error
    expect(() => container.register(Wizard, { useExisting: Wizard })).toThrowErrorMatchingInlineSnapshot(
      `[Error: [di-wise] the useExisting token Type<Wizard> cannot be the same as the token being registered]`,
    );

    container.register(Wizard, { useExisting: WizardImpl });
    expect(container.resolve(WizardImpl)).toBe(container.resolve(Wizard));
  });

  it("should throw error if existing provider points to unregistered token", () => {
    class Registered {}
    class NotRegistered {}

    container.register(Registered, { useExisting: NotRegistered });

    // When resolving a token using an ExistingProvider that points to an unregistered token,
    // the error should include the original cause
    expect(() => container.resolve(Registered)).toThrowErrorMatchingInlineSnapshot(
      `
      [Error: [di-wise] token resolution error encountered while resolving Registered
        [cause] the aliased token NotRegistered is not registered]
      `,
    );

    // It is unclear to me how this should behave.
    // As of now, let's simply document the fact that a resolveAll call
    // to a registered token using an ExistingProvider pointing to a
    // non-registered token will throw an error.
    expect(() => container.resolveAll(Registered)).toThrowErrorMatchingInlineSnapshot(
      `
      [Error: [di-wise] token resolution error encountered while resolving Registered
        [cause] the aliased token NotRegistered is not registered]
      `,
    );
  });

  it("should throw error if resolving existing provider with circular dependency", () => {
    @Scoped(Scope.Container)
    class Wand {
      dep = inject(Wizard);
    }

    @Scoped(Scope.Container)
    class Wizard {
      dep = inject(Wand);
    }

    const Character = Type<Wizard>("Character");

    container.register(Wand);
    container.register(Wizard);
    container.register(Character, { useExisting: Wizard });

    expect(() => container.resolveAll(Character)).toThrowErrorMatchingInlineSnapshot(
      `
      [Error: [di-wise] token resolution error encountered while resolving Type<Character>
        [cause] circular dependency detected]
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

  it("should throw error if detected circular dependency", () => {
    class Wand {
      owner = inject(Wizard);
    }

    class Wizard {
      wands!: Wand[];

      setWand(@InjectAll(Wand) wands: Wand[]): Wand[] {
        this.wands = wands;
        return this.wands;
      }
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
    container.register(wizardToken, { useFactory: () => inject(Wizard) }, { scope: Scope.Container });
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
    expect(() => container.resolve(Wand)).toThrowErrorMatchingInlineSnapshot(
      `[Error: [di-wise] the container is disposed]`,
    );
    expect(() => child.resolve(Wand)).toThrowErrorMatchingInlineSnapshot(
      `[Error: [di-wise] the container is disposed]`,
    );

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
