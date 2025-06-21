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

  it("should clear the cache but keep the registrations", () => {
    class Wizard {}

    container.register(Wizard, { useClass: Wizard }, { scope: Scope.Container });

    const wizard = container.resolve(Wizard);
    expect(container.getCached(Wizard)).toBe(wizard);

    container.clearCache();
    expect(container.isRegistered(Wizard)).toBe(true);
    expect(container.getCached(Wizard)).toBeUndefined();
    expect(container.resolve(Wizard)).not.toBe(wizard);
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

    @Injectable(Character)
    class Wizard {}

    container.register(Wizard);
    expect(container.isRegistered(Character)).toBe(true);
    expect(container.isRegistered(Wizard)).toBe(true);
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

  it("should unregister a token", () => {
    const Env = Type<string>("Env");
    container.register(Env, { useValue: "production" });

    expect(container.isRegistered(Env)).toBe(true);
    container.unregister(Env);
    expect(container.isRegistered(Env)).toBe(false);
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
    expect(value.calls).toBe(1);

    // We can call dispose as many times as we want
    container.dispose();
    container.dispose();
  });
});
