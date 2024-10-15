import {assert} from "./errors";
import {ErrorMessage} from "./errors";
import {defineProvider, type InjectionProvider, NullProvider, UndefinedProvider} from "./provider";
import {InjectionScope} from "./scope";
import {type InjectionToken, Type} from "./token";

export interface Registration<T = any> {
  cache?: InstanceCache<T>;
  provider: InjectionProvider<T>;
}

export interface InstanceCache<T> {
  current: T;
}

export class Registry {
  private map = new Map<InjectionToken, Registration>();

  #parent?: Registry;

  constructor(parent?: Registry) {
    this.#parent = parent;
  }

  clear(): void {
    this.map.clear();
  }

  get<T>(token: InjectionToken<T>): Registration<T> | undefined {
    return (
      internals.get(token)
      || this.map.get(token)
      || this.#parent?.map.get(token)
    );
  }

  has(token: InjectionToken): boolean {
    return Boolean(
      internals.has(token)
      || this.map.has(token)
      || this.#parent?.map.has(token),
    );
  }

  set<T>(token: InjectionToken<T>, registration: Registration<T>): this {
    assert(!internals.has(token), ErrorMessage.ReservedToken, token.name);
    this.map.set(token, registration);
    return this;
  }

  values(): IterableIterator<Registration> {
    return this.map.values();
  }
}

export function Build<Value>(factory: (...args: []) => Value): Type<Value> {
  const token = Type<Value>(`Build<${factory.name || "anonymous"}>`);
  const provider = defineProvider({
    token,
    useFactory: factory,
    scope: InjectionScope.Transient,
  });
  internals.set(token, {provider});
  return token;
}

export function Value<T>(value: T): Type<T> {
  const token = Type<T>(`Value<${String(value)}>`);
  const provider = defineProvider({
    token,
    useValue: value,
  });
  internals.set(token, {provider});
  return token;
}

const internals = new WeakMap<InjectionToken, Registration>([
  [Type.Null, {provider: NullProvider}],
  [Type.Undefined, {provider: UndefinedProvider}],
]);
