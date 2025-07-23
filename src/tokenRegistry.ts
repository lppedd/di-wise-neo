import { assert } from "./errors";
import type { FactoryProvider, Provider } from "./provider";
import { Scope } from "./scope";
import { type Constructor, createType, type Token, type Type } from "./token";
import type { TokenRef } from "./tokensRef";
import { getTypeName } from "./utils/typeName";
import type { ValueRef } from "./valueRef";

/**
 * Token registration options.
 */
export interface RegistrationOptions {
  /**
   * The scope of the registration.
   */
  readonly scope?: Scope;
}

// @internal
export type InjectDecorator = "Inject" | "InjectAll" | "Optional" | "OptionalAll";

// @internal
export interface MethodDependency {
  // The index of the annotated parameter (zero-based)
  readonly index: number;

  appliedBy?: InjectDecorator;
  tokenRef?: TokenRef;
  name?: string;
}

// @internal
export interface Dependencies {
  readonly constructor: MethodDependency[];
  readonly methods: Map<string | symbol, MethodDependency[]>;
}

// @internal
export interface Registration<T = any> {
  readonly name?: string;
  readonly provider: Provider<T>;
  readonly options?: RegistrationOptions;
  readonly dependencies?: Dependencies;

  value?: ValueRef<T>;
}

// @internal
export class TokenRegistry {
  private readonly myParent?: TokenRegistry;
  private readonly myMap = new Map<Token, Registration[]>();

  constructor(parent: TokenRegistry | undefined) {
    this.myParent = parent;
  }

  get<T>(token: Token<T>, name?: string): Registration<T> | undefined {
    // To clarify, at(-1) means we take the last added registration for this token
    return this.getAll(token, name).at(-1);
  }

  getAll<T>(token: Token<T>, name?: string): Registration<T>[] {
    // Internal registrations cannot have a name
    const internal = name !== undefined ? undefined : internals.get(token);
    return (internal && [internal]) || this.getAllFromParent(token, name);
  }

  set<T extends object>(token: Type<T> | Constructor<T>, registration: Registration<T>): void;
  set<T>(token: Token<T>, registration: Registration<T>): void;
  set<T>(token: Token<T>, registration: Registration<T>): void {
    assert(!internals.has(token), `cannot register reserved token ${token.name}`);
    let registrations = this.myMap.get(token);

    if (!registrations) {
      this.myMap.set(token, (registrations = []));
    } else if (registration.name !== undefined) {
      const existing = registrations.filter((r) => r.name === registration.name);
      assert(existing.length === 0, `a ${token.name} token named '${registration.name}' is already registered`);
    }

    registrations.push(registration);
  }

  delete<T>(token: Token<T>, name?: string): Registration<T>[] {
    const registrations = this.myMap.get(token);

    if (registrations) {
      if (name !== undefined) {
        const removedRegistrations: Registration[] = [];
        const newRegistrations: Registration[] = [];

        for (const registration of registrations) {
          const array = registration.name === name ? removedRegistrations : newRegistrations;
          array.push(registration);
        }

        if (removedRegistrations.length > 0) {
          this.myMap.set(token, newRegistrations);
          return removedRegistrations;
        }
      }

      this.myMap.delete(token);
    }

    return registrations ?? [];
  }

  deleteAll(): [Token[], Registration[]] {
    const tokens = Array.from(this.myMap.keys());
    const registrations = Array.from(this.myMap.values()).flat();
    this.myMap.clear();
    return [tokens, registrations];
  }

  clearRegistrations(): unknown[] {
    const values = new Set<unknown>();

    for (const registrations of this.myMap.values()) {
      for (let i = 0; i < registrations.length; i++) {
        const registration = registrations[i]!;
        const value = registration.value;

        if (value) {
          values.add(value.current);
        }

        registrations[i] = {
          ...registration,
          value: undefined,
        };
      }
    }

    return Array.from(values);
  }

  private getAllFromParent<T>(token: Token<T>, name?: string): Registration<T>[] {
    const thisRegistrations = this.myMap.get(token);
    let registrations = thisRegistrations || this.myParent?.getAllFromParent(token, name);

    if (registrations && name !== undefined) {
      registrations = registrations.filter((r) => r.name === name);
      assert(registrations.length < 2, `internal error: more than one registration named '${name}'`);
    }

    return registrations ?? [];
  }
}

// @internal
export function isBuilder(provider: Provider): boolean {
  return builders.has(provider);
}

/**
 * Create a one-off type token from a factory function.
 *
 * @example
 * ```ts
 * class Wizard {
 *   wand = inject(
 *     build(() => {
 *       const wand = inject(Wand);
 *       wand.owner = this;
 *       // ...
 *       return wand;
 *     }),
 *   );
 * }
 * ```
 *
 * @__NO_SIDE_EFFECTS__
 */
export function build<Value>(factory: (...args: []) => Value): Type<Value> {
  const token = createType<Value>(`Build<${getTypeName(factory)}>`);
  const provider: FactoryProvider<Value> = {
    useFactory: factory,
  };

  internals.set(token, {
    provider: provider,
    options: {
      scope: Scope.Transient,
    },
  });

  builders.add(provider);
  return token;
}

const internals = new WeakMap<Token, Registration>();
const builders = new WeakSet<Provider>();
