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
export type Decorator = "Inject" | "InjectAll" | "Optional" | "OptionalAll";

// @internal
export interface MethodDependency {
  readonly decorator: Decorator;
  readonly tokenRef: TokenRef;

  // The index of the annotated parameter (zero-based)
  readonly index: number;
}

// @internal
export interface Dependencies {
  readonly constructor: MethodDependency[];
  readonly methods: Map<string | symbol, MethodDependency[]>;
}

// @internal
export interface Registration<T = any> {
  value?: ValueRef<T>;
  readonly provider: Provider<T>;
  readonly options?: RegistrationOptions;
  readonly dependencies?: Dependencies;
}

// @internal
export class TokenRegistry {
  private readonly myMap = new Map<Token, Registration[]>();

  constructor(private readonly parent: TokenRegistry | undefined) {}

  get<T>(token: Token<T>): Registration<T> | undefined {
    // To clarify, at(-1) means we take the last added registration for this token
    return this.getAll(token)?.at(-1);
  }

  getAll<T>(token: Token<T>): Registration<T>[] | undefined {
    const internal = internals.get(token);
    return (internal && [internal]) || this.getAllFromParent(token);
  }

  //
  // set(...) overloads added because of TS distributive conditional types.
  //
  // TODO(Edoardo): is there a better way? Maybe refactor the Token<T> type
  //  into two types, TokenObject<T extends object> | Token<T>
  //

  set<T extends object>(token: Type<T> | Constructor<T>, registration: Registration<T>): void;
  set<T>(token: Token<T>, registration: Registration<T>): void;
  set<T>(token: Token<T>, registration: Registration<T>): void {
    assert(!internals.has(token), `cannot register reserved token ${token.name}`);

    let registrations = this.myMap.get(token);

    if (!registrations) {
      this.myMap.set(token, (registrations = []));
    }

    registrations.push(registration);
  }

  delete<T>(token: Token<T>): Registration<T>[] | undefined {
    const registrations = this.myMap.get(token);
    this.myMap.delete(token);
    return registrations;
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

  private getAllFromParent<T>(token: Token<T>): Registration<T>[] | undefined {
    const registrations = this.myMap.get(token);
    return registrations || this.parent?.getAllFromParent(token);
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
