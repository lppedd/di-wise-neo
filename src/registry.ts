import { assert } from "./errors";
import type { InstanceRef } from "./instanceRef";
import {
  type FactoryProvider,
  NullProvider,
  type Provider,
  UndefinedProvider,
  type ValueProvider,
} from "./provider";
import { Scope } from "./scope";
import { type Token, Type } from "./token";
import { getTypeName } from "./utils/typeName";

export type RegistrationMap = Omit<Map<Token, Registration[]>, keyof Registry>;

export interface Registration<T = any> {
  options?: RegistrationOptions;
  instance?: InstanceRef<T>;
  provider: Provider<T>;
}

/**
 * Registration options.
 */
export interface RegistrationOptions {
  /**
   * The scope of the registration.
   */
  readonly scope?: Scope;
}

export class Registry {
  private readonly myMap = new Map<Token, Registration[]>();

  constructor(private readonly parent: Registry | undefined) {}

  get map(): RegistrationMap {
    return this.myMap;
  }

  get<T>(token: Token<T>): Registration<T> | undefined {
    // To clarify, at(-1) means we take the last added registration for this token
    return this.getAll(token)?.at(-1);
  }

  getAll<T>(token: Token<T>): Registration<T>[] | undefined {
    const internal = internals.get(token);
    return (internal && [internal]) || this.getAllFromHierarchy(token);
  }

  set<T>(token: Token<T>, registration: Registration<T>): void {
    assert(!internals.has(token), `cannot register reserved token ${token.name}`);

    let registrations = this.myMap.get(token);

    if (!registrations) {
      this.myMap.set(token, (registrations = []));
    }

    registrations.push(registration);
  }

  private getAllFromHierarchy<T>(token: Token<T>): Registration<T>[] | undefined {
    const registrations = this.myMap.get(token);
    return registrations || this.parent?.getAllFromHierarchy(token);
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
 *     Build(() => {
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
export function Build<Value>(factory: (...args: []) => Value): Type<Value> {
  const token = Type<Value>(`Build<${getTypeName(factory)}>`);
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

/**
 * Create a one-off type token from a value.
 *
 * Used for providing default values.
 *
 * @example
 * ```ts
 * class Wizard {
 *   name = inject(Name, Value("Harry"));
 * }
 *
 * const wizard = container.resolve(Wizard);
 * wizard.name; // => "Harry"
 * ```
 *
 * @__NO_SIDE_EFFECTS__
 */
export function Value<T>(value: T): Type<T> {
  const token = Type<T>(`Value<${getTypeName(value)}>`);
  const provider: ValueProvider<T> = {
    useValue: value,
  };

  internals.set(token, {
    provider: provider,
  });

  return token;
}

const internals = new WeakMap<Token, Registration>([
  [Type.Null, { provider: NullProvider }],
  [Type.Undefined, { provider: UndefinedProvider }],
]);

const builders = new WeakSet<Provider>();
