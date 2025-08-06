// noinspection JSUnusedGlobalSymbols,JSUnusedLocalSymbols
/* eslint-disable no-use-before-define */

import { afterEach, assert, describe, expect, it } from "vitest";

import {
  AutoRegister,
  build,
  createContainer,
  createType,
  EagerInstantiate,
  forwardRef,
  Inject,
  inject,
  Injectable,
  InjectAll,
  injectAll,
  Optional,
  OptionalAll,
  Scope,
  Scoped
} from "..";
import { Named } from "../decorators";
import { useInjectionContext } from "../injectionContext";
import { optional } from "../optional";
import { optionalAll } from "../optionalAll";

describe("Container", () => {
  const container = createContainer();

  afterEach(() => {
    container.resetRegistry();
  });

  it("should create container with default options", () => {
    expect(container.options.autoRegister).toBe(false);
    expect(container.options.defaultScope).toBe(Scope.Transient);
  });

  it("should create child container with different options", () => {
    const child = container.createChild({
      autoRegister: true,
      defaultScope: Scope.Container,
    });

    expect(child.options.autoRegister).toBe(true);
    expect(child.options.defaultScope).toBe(Scope.Container);

    child.dispose();
  });

  it("should handle hierarchical injection", () => {
    const parent = createContainer({
      defaultScope: Scope.Container,
    });

    const Env = createType<string>("Env");
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
    expect(child.parent).toBe(parent);
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
    const Env = createType<string>("Env");
    const Port = createType<number>("Port");
    const Null = createType<null>("Null");
    const Undefined = createType<undefined>("Undefined");

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
    const Character = createType<{}>("Character");
    const Dumbledore = createType<{}>("Dumbledore");

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
    const Character = createType<{}>("Character");
    const Hero = createType<{}>("Hero");

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
    const Spell = createType<string>("Spell");

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
    const Spell = createType<string>("Spell");

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
      const Wand = createType<string>("Wand");

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      class Wizard {
        static setWand(@Inject(Wand) _wand: string): void {}
      }
    }).toThrowErrorMatchingInlineSnapshot(`[Error: [di-wise-neo] @Inject cannot be used on static method Wizard.setWand]`);
  });

  it("should throw when @Optional is applied to static methods", () => {
    expect(() => {
      const Wand = createType<string>("Wand");

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      class Wizard {
        static setWand(@Optional(Wand) _wand: string | undefined): void {}
      }
    }).toThrowErrorMatchingInlineSnapshot(`[Error: [di-wise-neo] @Optional cannot be used on static method Wizard.setWand]`);
  });

  it("should throw when @InjectAll is applied to static methods", () => {
    expect(() => {
      const Wand = createType<string>("Wand");

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      class Wizard {
        static setWands(@InjectAll(Wand) _wands: string[]): void {}
      }
    }).toThrowErrorMatchingInlineSnapshot(`[Error: [di-wise-neo] @InjectAll cannot be used on static method Wizard.setWands]`);
  });

  it("should throw when @OptionalAll is applied to static methods", () => {
    expect(() => {
      const Wand = createType<string>("Wand");

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      class Wizard {
        static setWands(@OptionalAll(Wand) _wands: string[]): void {}
      }
    }).toThrowErrorMatchingInlineSnapshot(`[Error: [di-wise-neo] @OptionalAll cannot be used on static method Wizard.setWands]`);
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
      `
      [Error: [di-wise-neo] failed to resolve token Wizard
        [cause] Wizard expected 2 decorated constructor parameters, but found 1]
      `,
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
      `
      [Error: [di-wise-neo] failed to resolve token Wizard
        [cause] Wizard expected 3 decorated constructor parameters, but found 2]
      `,
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
      `
      [Error: [di-wise-neo] failed to resolve token Wizard
        [cause] Wizard expected 3 decorated constructor parameters, but found 2]
      `,
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
      `
      [Error: [di-wise-neo] failed to resolve token Wizard
        [cause] Wizard.set expected 3 decorated method parameters, but found 2]
      `,
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
      `
      [Error: [di-wise-neo] failed to resolve token Wizard
        [cause] Wizard.set expected 3 decorated method parameters, but found 2]
      `,
    );
  });

  it("should throw when multiple injection decorators are used on a parameter", () => {
    @AutoRegister()
    @Named("super")
    class Wand {}

    expect(() => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      class Wizard {
        set(@Inject(Wand) @Optional(Wand) _wand: Wand): void {}
      }
    }).toThrowErrorMatchingInlineSnapshot(
      `[Error: [di-wise-neo] multiple injection decorators on Wizard.set(parameter #0), but only one is allowed]`,
    );

    expect(() => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      class Wizard {
        constructor(@OptionalAll(Wand) @InjectAll(Wand) _wand: Wand[]) {}
      }
    }).toThrowErrorMatchingInlineSnapshot(
      `[Error: [di-wise-neo] multiple injection decorators on Wizard(parameter #0), but only one is allowed]`,
    );

    expect(() => {
      class Wizard {
        constructor(@Inject(Wand) @Named("super") readonly wand: Wand) {}
      }

      const wizard = container.register(Wizard).resolve(Wizard);
      expect(wizard.wand).toBeInstanceOf(Wand);
    }).not.toThrow();
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
    const Env = createType<string>("Env");

    @Scoped(Scope.Container)
    class Product {
      env = inject(Env);
    }

    // Unregistering an unregistered token should simply return an empty array
    expect(container.unregister(Env)).toEqual([]);

    container.register(Env, { useValue: "production" });
    container.register(Product, { useClass: Product });
    container.register(Product, { useClass: Product, name: "FreeProduct" });

    expect(container.isRegistered(Env)).toBe(true);
    expect(container.isRegistered(Product)).toBe(true);
    expect(container.isRegistered(Product, "FreeProduct")).toBe(true);

    expect(container.resolve(Product)).toBeInstanceOf(Product);

    // Values provided via ValueProvider are not returned
    expect(container.unregister(Env)).toEqual([]);
    expect(container.isRegistered(Env)).toBe(false);

    const freeProduct = container.unregister(Product, "FreeProduct");
    expect(freeProduct).toHaveLength(1);
    expect(freeProduct[0]).toBeInstanceOf(Product);

    expect(container.isRegistered(Product, "FreeProduct")).toBe(false);
    expect(container.isRegistered(Product)).toBe(true);

    container.unregister(Product);
    expect(container.isRegistered(Product)).toBe(false);
  });

  it("should throw when the token is not registered", () => {
    const Env = createType<string>("Env");

    expect(() => container.resolve(Env)).toThrowErrorMatchingInlineSnapshot(
      `[Error: [di-wise-neo] unregistered token Type<Env>]`,
    );

    expect(() => container.resolve(Env, "Node")).toThrowErrorMatchingInlineSnapshot(
      `[Error: [di-wise-neo] unregistered token Type<Env>[name=Node]]`,
    );

    expect(() => container.resolveAll(Env)).toThrowErrorMatchingInlineSnapshot(
      `[Error: [di-wise-neo] unregistered token Type<Env>]`,
    );

    @Named("Dumbledore")
    class Wizard {}

    expect(() => container.resolve(Wizard)).toThrowErrorMatchingInlineSnapshot(
      `[Error: [di-wise-neo] unregistered token Wizard]`,
    );

    expect(() => container.resolve(Wizard, "Voldemort")).toThrowErrorMatchingInlineSnapshot(
      `[Error: [di-wise-neo] unregistered token Wizard[name=Voldemort]]`,
    );

    expect(() => container.resolveAll(Wizard)).toThrowErrorMatchingInlineSnapshot(
      `[Error: [di-wise-neo] unregistered token Wizard]`,
    );

    @Named("Potter")
    @AutoRegister()
    @Scoped(Scope.Container)
    class Wand {}

    expect(() => container.resolve(Wand, "Weasley")).toThrowErrorMatchingInlineSnapshot(
      `[Error: [di-wise-neo] unregistered token Wand[name=Weasley]]`,
    );

    expect(container.resolve(Wand)).toBe(container.resolve(Wand, "Potter"));

    // An anonymous/unnamed class
    expect(() => container.resolve(class {})).toThrowErrorMatchingInlineSnapshot(
      `[Error: [di-wise-neo] unregistered token <unnamed>]`,
    );
  });

  it("should resolve all tokens", () => {
    const Character = createType<{ name: string }>("Character");

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

    const Person = createType<{ name: string }>("Person");

    container.register(Wizard);
    container.register(Witch);

    const persons = container.resolveAll(Person);
    expect(persons).toHaveLength(1);
    expect(persons[0]!.name).toBe("Witch");

    const characters = container.resolveAll(Character);
    expect(characters).toHaveLength(2);
    expect(characters.map(({ name }) => name)).toEqual(["Wizard", "Witch"]);
  });

  it("should instantiate container-scoped @EagerInstantiate classes", () => {
    let isInstantiated = false;

    @EagerInstantiate()
    @Scoped(Scope.Container)
    class Wand {
      constructor() {
        isInstantiated = true;
      }
    }

    container.register(Wand);
    expect(isInstantiated).toBe(true);

    isInstantiated = false;
    container.resetRegistry();
    container.register(Wand, { useClass: Wand });
    expect(isInstantiated).toBe(true);
  });

  it("should throw when conflicting class scopes are set by decorators", () => {
    expect(() => {
      @Scoped(Scope.Transient)
      @Scoped(Scope.Container) // eslint-disable-next-line @typescript-eslint/no-unused-vars
      class Wizard {}
    }).toThrowErrorMatchingInlineSnapshot(
      `
      [Error: [di-wise-neo] class Wizard: Scope.Container was already set by another @Scoped decorator,
        but @Scoped is trying to set a conflicting Scope.Transient.
        Only one decorator should set the class scope, or all must agree on the same value.]
      `,
    );

    expect(() => {
      @EagerInstantiate()
      @Scoped(Scope.Transient) // eslint-disable-next-line @typescript-eslint/no-unused-vars
      class Wizard {}
    }).toThrowErrorMatchingInlineSnapshot(
      `
      [Error: [di-wise-neo] class Wizard: Scope.Transient was already set by @Scoped,
        but @EagerInstantiate is trying to set a conflicting Scope.Container.
        Only one decorator should set the class scope, or all must agree on the same value.]
      `,
    );

    expect(() => {
      @Scoped(Scope.Transient)
      @EagerInstantiate() // eslint-disable-next-line @typescript-eslint/no-unused-vars
      class Wizard {}
    }).toThrowErrorMatchingInlineSnapshot(
      `
      [Error: [di-wise-neo] class Wizard: Scope.Container was already set by @EagerInstantiate,
        but @Scoped is trying to set a conflicting Scope.Transient.
        Only one decorator should set the class scope, or all must agree on the same value.]
      `,
    );
  });

  it("should not throw error if multiple decorators set the same scope", () => {
    @Scoped(Scope.Container)
    @EagerInstantiate()
    @Scoped(Scope.Container)
    @Scoped(Scope.Container) // eslint-disable-next-line @typescript-eslint/no-unused-vars
    class Wizard {}
  });

  it("should throw if @EagerInstantiate class cannot resolve dependencies", () => {
    const Castle = createType<string>("Castle");

    @EagerInstantiate()
    @Scoped(Scope.Container)
    class Wizard {
      constructor(@Inject(Castle) @Named("Hogwarts") _castle: string) {}
    }

    expect(() => container.register(Wizard)).toThrowErrorMatchingInlineSnapshot(
      `
      [Error: [di-wise-neo] failed to resolve dependency for Wizard(parameter #0: Type<Castle>[name=Hogwarts])
        [cause] unregistered token Type<Castle>[name=Hogwarts]]
      `,
    );
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
    const Wizard = createType<WizardImpl>("Wizard");

    container.register(WizardImpl);

    // We should not be able to register a token pointing to itself,
    // as it would cause a circular dependency error
    expect(() => container.register(Wizard, { useExisting: Wizard })).toThrowErrorMatchingInlineSnapshot(
      `[Error: [di-wise-neo] token Type<Wizard> cannot alias itself via useExisting]`,
    );

    container.register(Wizard, { useExisting: WizardImpl });
    expect(container.resolve(WizardImpl)).toBe(container.resolve(Wizard));
  });

  it("should throw when named qualifier is empty or blank", () => {
    expect(() => {
      @Named("  ") // eslint-disable-next-line @typescript-eslint/no-unused-vars
      class Wizard {}
    }).toThrowErrorMatchingInlineSnapshot(`[Error: [di-wise-neo] @Named qualifier must not be empty]`);

    expect(() => {
      class Wizard {}
      container.register(Wizard, {
        useValue: new Wizard(),
        name: "  ",
      });
    }).toThrowErrorMatchingInlineSnapshot(`[Error: [di-wise-neo] name qualifier for token Wizard must not be empty]`);
  });

  it("should resolve named class provider", () => {
    @Scoped(Scope.Container)
    @Named("Dumbledore")
    class Wizard {}

    container.register(Wizard);
    expect(container.resolve(Wizard, "Dumbledore")).toBe(container.resolve(Wizard));
  });

  it("should inject named token", () => {
    @Scoped(Scope.Container)
    class Wand {}

    @Scoped(Scope.Container)
    class Wizard {
      superWand?: Wand;

      constructor(@Inject(Wand) @Named("SuperWand") readonly wand: Wand) {}

      setWand(@Inject(Wand) @Named("SuperWand") wand: Wand): void {
        this.superWand = wand;
      }
    }

    container.register(Wand, { useClass: Wand, name: "SuperWand" });
    container.register(Wizard);

    const wizard = container.resolve(Wizard);
    expect(wizard).toBeInstanceOf(Wizard);
    expect(wizard.wand).toBeTruthy();
    expect(wizard.superWand).toBeTruthy();
  });

  it("should throw when multiple @Named decorators are used", () => {
    class Wand {}

    expect(() => {
      @Named("Dumbledore")
      @Named("Voldemort") // eslint-disable-next-line @typescript-eslint/no-unused-vars
      class Wizard {}
    }).toThrowErrorMatchingInlineSnapshot(
      `[Error: [di-wise-neo] multiple @Named decorators on class Wizard, but only one is allowed]`,
    );

    expect(() => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      class Wizard {
        constructor(@Inject(Wand) @Named("SuperWand2") @Named("SuperWand1") readonly wand: Wand) {}
      }
    }).toThrowErrorMatchingInlineSnapshot(
      `[Error: [di-wise-neo] multiple @Named decorators on Wizard(parameter #0), but only one is allowed]`,
    );

    expect(() => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      class Wizard {
        set(@Inject(Wand) @Named("SuperWand2") @Named("SuperWand1") _wand: Wand): void {}
      }
    }).toThrowErrorMatchingInlineSnapshot(
      `[Error: [di-wise-neo] multiple @Named decorators on Wizard.set(parameter #0), but only one is allowed]`,
    );
  });

  it("should throw when @Named is used with @InjectAll", () => {
    class Wand {}

    expect(() => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      class Wizard {
        constructor(@Named("Wand") @InjectAll(Wand) _wand: Wand) {}
      }
    }).toThrowErrorMatchingInlineSnapshot(
      `[Error: [di-wise-neo] @Named has no effect on Wizard(parameter #0) when used with @InjectAll]`,
    );

    expect(() => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      class Wizard {
        constructor(@InjectAll(Wand) @Named("Wand") _wand: Wand) {}
      }
    }).toThrowErrorMatchingInlineSnapshot(
      `[Error: [di-wise-neo] @Named has no effect on Wizard(parameter #0) when used with @InjectAll]`,
    );
  });

  it("should throw when @Named is used with @OptionalAll", () => {
    class Wand {}

    expect(() => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      class Wizard {
        constructor(@Named("Wand") @OptionalAll(Wand) _wand: Wand) {}
      }
    }).toThrowErrorMatchingInlineSnapshot(
      `[Error: [di-wise-neo] @Named has no effect on Wizard(parameter #0) when used with @OptionalAll]`,
    );

    expect(() => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      class Wizard {
        constructor(@OptionalAll(Wand) @Named("Wand") _wand: Wand) {}
      }
    }).toThrowErrorMatchingInlineSnapshot(
      `[Error: [di-wise-neo] @Named has no effect on Wizard(parameter #0) when used with @OptionalAll]`,
    );
  });

  it("should throw when the same name is registered", () => {
    @Scoped(Scope.Container)
    @Named("Dumbledore")
    class Wizard {}

    container.register(Wizard);
    expect(() => container.register(Wizard)).toThrowErrorMatchingInlineSnapshot(
      `[Error: [di-wise-neo] token Wizard with name 'Dumbledore' is already registered]`,
    );
  });

  it("should throw if existing provider points to unregistered token", () => {
    class Registered {}
    class NotRegistered {}

    container.register(Registered, { useExisting: NotRegistered });

    expect(() => container.resolve(Registered)).toThrowErrorMatchingInlineSnapshot(
      `
      [Error: [di-wise-neo] failed to resolve token Registered (alias for NotRegistered)
        [cause] useExisting points to unregistered token NotRegistered]
      `,
    );

    expect(() => container.resolve(Registered, "Unregistered")).toThrowErrorMatchingInlineSnapshot(
      `
      [Error: [di-wise-neo] failed to resolve token Registered[name=Unregistered] (alias for NotRegistered)
        [cause] useExisting points to unregistered token NotRegistered[name=Unregistered]]
      `,
    );

    expect(container.resolveAll(Registered, true)).toEqual([]);

    // It is unclear to me how this should behave.
    // As of now, let's simply document the fact that a resolveAll call
    // to a registered token using an ExistingProvider pointing to a
    // non-registered token will throw an error.
    expect(() => container.resolveAll(Registered)).toThrowErrorMatchingInlineSnapshot(
      `
      [Error: [di-wise-neo] failed to resolve token Registered (alias for NotRegistered)
        [cause] useExisting points to unregistered token NotRegistered]
      `,
    );
  });

  it("should resolve deep aliases", () => {
    class Alias1 {}
    class Alias2 {}
    class Alias3 {}
    class Target {}

    container.register(Target);
    container.register(Alias1, { useExisting: Target });
    container.register(Alias2, { useExisting: Alias1 });
    container.register(Alias3, { useExisting: Alias2 });

    expect(container.resolve(Alias3)).toBeInstanceOf(Target);

    container.unregister(Target);
    container.register(Target, { useClass: Target, name: "Registered" });

    expect(container.resolve(Alias3, "Registered")).toBeInstanceOf(Target);
    expect(() => container.resolve(Alias3, "Unregistered")).toThrowErrorMatchingInlineSnapshot(
      `
      [Error: [di-wise-neo] failed to resolve token Alias3[name=Unregistered] (alias for Alias2 → Alias1 → Target)
        [cause] useExisting points to unregistered token Target[name=Unregistered]]
      `,
    );

    // In case the named registrations doesn't exist but resolution is optional
    // we should simply return undefined
    expect(container.resolve(Alias3, true, "Unregistered")).toBeUndefined();
  });

  it("should throw if circular aliases", () => {
    class Alias1 {}
    class Alias2 {}
    class Alias3 {}

    container.register(Alias1, { useExisting: Alias3 });
    container.register(Alias2, { useExisting: Alias1 });
    container.register(Alias3, { useExisting: Alias2 });

    expect(() => container.resolve(Alias3)).toThrowErrorMatchingInlineSnapshot(
      `[Error: [di-wise-neo] circular alias detected: Alias3 → Alias2 → Alias1 → Alias3]`,
    );
  });

  it("should throw if resolving existing provider with circular dependency", () => {
    const IWand = createType<Wand>("Wand");
    const IWizard = createType<Wizard>("Wizard");

    @Injectable(IWand)
    @Scoped(Scope.Container)
    class Wand {
      dep = inject(IWizard);
    }

    @Injectable(IWizard)
    @Scoped(Scope.Container)
    class Wizard {
      dep = inject(IWand);
    }

    const Character = createType<Wizard>("Character");

    container.register(Wand);
    container.register(Wizard);
    container.register(Character, { useExisting: Wizard });

    expect(() => container.resolveAll(Character)).toThrowErrorMatchingInlineSnapshot(
      `
      [Error: [di-wise-neo] failed to resolve token Type<Character> (alias for Wizard)
        [cause] failed to resolve token Type<Wand> (alias for Wand)
        [cause] failed to resolve token Type<Wizard> (alias for Wizard)
        [cause] circular dependency detected while resolving Type<Character> → Type<Wand> → Type<Wizard>]
      `,
    );
  });

  it("should resolve class providers", () => {
    class WizardImpl {}
    const Wizard = createType<WizardImpl>("Wizard");

    container.register(Wizard, { useClass: WizardImpl });
    expect(container.resolve(Wizard)).toBeInstanceOf(WizardImpl);
  });

  it("should resolve factory providers", () => {
    class WizardImpl {}
    const Wizard = createType<WizardImpl>("Wizard");

    container.register(Wizard, { useFactory: () => new WizardImpl() });
    expect(container.resolve(Wizard)).toBeInstanceOf(WizardImpl);
  });

  it("should resolve value providers", () => {
    const Env = createType<string>("Env");

    container.register(Env, { useValue: "development" });
    expect(container.resolve(Env)).toBe("development");
  });

  it("should switch context", () => {
    const child = container.createChild();

    container.resolve(
      build(() => {
        const context = useInjectionContext()!;

        child.resolve(
          build(() => {
            const innerContext = useInjectionContext()!;
            expect(innerContext).not.toBe(context);
            expect(innerContext.container).toBe(child);
            expect(innerContext.resolution).not.toBe(context.resolution);
          }),
        );
      }),
    );
  });

  it("should throw if detected circular dependency", () => {
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

    container.register(Wand);
    container.register(Wizard);

    expect(() => container.resolve(Wizard)).toThrowErrorMatchingInlineSnapshot(
      `
      [Error: [di-wise-neo] failed to resolve token Wizard
        [cause] failed to resolve dependency for Wizard.setWand(parameter #0: Wand)
        [cause] failed to resolve token Wand
        [cause] failed to resolve token Wizard
        [cause] circular dependency detected while resolving Wizard → Wand → Wizard]
      `,
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

    container.register(Decoration);
    container.register(Wand);
    container.register(Wizard);

    const wizard = container.resolve(Wizard);
    expect(wizard.wand.decoration).toBe(wizard.decoration);
  });

  it("should dispose itself and its registrations", () => {
    @Scoped(Scope.Container)
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
    const wizardToken = createType<Wizard>("SecondaryWizard");
    container.register(wizardToken, { useFactory: () => inject(Wizard) }, { scope: Scope.Container });
    container.register(Wizard);
    container.register(Wand);

    const value = new Wand();
    const valueToken = createType<Wand>("ValueWand");
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
    expect(() => container.resolve(Wand)).toThrowErrorMatchingInlineSnapshot(`[Error: [di-wise-neo] container is disposed]`);
    expect(() => child.resolve(Wand)).toThrowErrorMatchingInlineSnapshot(`[Error: [di-wise-neo] container is disposed]`);

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
