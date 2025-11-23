import { check, getTokenName } from "./errors";
import type { ExistingProvider, FactoryProvider, Provider, ValueProvider } from "./provider";
import { Scope } from "./scope";
import { type Constructor, createType, type Token, type Type } from "./token";
import type { TokenRef } from "./tokenRef";
import { getTypeName } from "./utils/typeName";
import type { ValueRef } from "./valueRef";

// @internal
export interface ConstructorProvider<Instance extends object> {
  readonly useClass: Constructor<Instance>;
  readonly name?: string;
}

// @internal
export type RegistrationProvider<Value = any> =
  | ConstructorProvider<Value & object>
  | FactoryProvider<Value>
  | ValueProvider<Value>
  | ExistingProvider<Value>;

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
  readonly ctor: MethodDependency[];
  readonly methods: Map<string | symbol, MethodDependency[]>;
}

// @internal
export interface Registration<T = any> {
  readonly name?: string;
  readonly provider: RegistrationProvider<T>;
  readonly options?: RegistrationOptions;
  readonly dependencies?: Dependencies;

  value?: ValueRef<T>;
}

// @internal
export class TokenRegistry {
  private readonly myParent?: TokenRegistry;
  private readonly myRegistrations = new Map<Token, Registration[]>();

  constructor(parent?: TokenRegistry) {
    this.myParent = parent;
  }

  get<T extends object>(token: Constructor<T>, name?: string): Registration<T> | undefined;
  get<T>(token: Token<T>, name?: string): Registration<T> | undefined;
  get<T>(token: Token<T>, name?: string): Registration<T> | undefined {
    // To clarify, at(-1) means we take the last added registration for this token
    return this.getAll(token, name).at(-1);
  }

  getAll<T>(token: Token<T>, name?: string): Registration<T>[] {
    // Internal registrations cannot have a name
    const internal = name !== undefined ? undefined : internals.get(token);
    return (internal && [internal]) || this.getAllFromParent(token, name);
  }

  put<T extends object>(token: Type<T> | Constructor<T>, registration: Registration<T>): void;
  put<T>(token: Token<T>, registration: Registration<T>): void;
  put<T>(token: Token<T>, registration: Registration<T>): void {
    check(!internals.has(token), `cannot register reserved token ${token.name}`);
    let registrations = this.myRegistrations.get(token);

    if (registrations) {
      const name = registration.name;

      if (name !== undefined) {
        const existing = registrations.filter((r) => r.name === name);
        check(existing.length === 0, `token ${getTokenName(token)} with name '${name}' is already registered`);
      }
    } else {
      this.myRegistrations.set(token, (registrations = []));
    }

    registrations.push(registration);
  }

  delete<T>(token: Token<T>, name?: string): Registration<T>[] {
    const registrations = this.myRegistrations.get(token);

    if (!registrations) {
      return [];
    }

    if (name !== undefined) {
      const removed: Registration[] = [];
      const updated: Registration[] = [];

      for (const registration of registrations) {
        (registration.name === name ? removed : updated).push(registration);
      }

      if (removed.length > 0) {
        this.myRegistrations.set(token, updated);
        return removed;
      }
    }

    this.myRegistrations.delete(token);
    return registrations;
  }

  deleteAll(): [Token[], Registration[]] {
    const tokens = Array.from(this.myRegistrations.keys());
    const registrations = Array.from(this.myRegistrations.values()).flat();
    this.myRegistrations.clear();
    return [tokens, registrations];
  }

  clearCache(): unknown[] {
    const values = new Set<unknown>();

    for (const registrations of this.myRegistrations.values()) {
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
    let registrations = this.myRegistrations.get(token) || this.myParent?.getAllFromParent(token, name);

    if (registrations && name !== undefined) {
      registrations = registrations.filter((r) => r.name === name);
      check(registrations.length < 2, `internal error: more than one registration named '${name}'`);
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
 */
export function build<Value>(factory: (...args: []) => Value): Type<Value>;

// @internal
export function build<Value>(factory: (...args: []) => Value, name: string): Type<Value>;

// @__NO_SIDE_EFFECTS__
export function build<Value>(factory: (...args: []) => Value, name?: string): Type<Value> {
  const token = createType<Value>(name ?? `Build<${getTypeName(factory)}>`);
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
