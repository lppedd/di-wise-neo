import {assert} from "./errors";
import type {InstanceRef} from "./instance";
import {NullProvider, type Provider, UndefinedProvider} from "./provider";
import {Scope} from "./scope";
import {type Token, Type} from "./token";
import {getTypeName} from "./utils/type-name";

export type RegistrationMap = Omit<
  Map<Token, Registration[]>,
  keyof Registry
>;

export interface Registration<T = any> {
  options?: RegistrationOptions;
  instance?: InstanceRef<T>;
  provider: Provider<T>;
}

export interface RegistrationOptions {
  readonly scope?: Scope;
}

export class Registry {
  private _map = new Map<Token, Registration[]>();

  map: RegistrationMap = this._map;

  parent?: Registry;

  constructor(parent?: Registry) {
    this.parent = parent;
  }

  get<T>(token: Token<T>): Registration<T> | undefined {
    return (
      internals.get(token)
      || this._get(token)
    );
  }

  private _get<T>(token: Token<T>): Registration<T> | undefined {
    const registrations = this._map.get(token);
    return (
      registrations?.at(-1)
      || this.parent?._get(token)
    );
  }

  getAll<T>(token: Token<T>): Registration<T>[] | undefined {
    const internal = internals.get(token);
    return (
      (internal && [internal])
      || this._getAll(token)
    );
  }

  private _getAll<T>(token: Token<T>): Registration<T>[] | undefined {
    const registrations = this._map.get(token);
    return (
      registrations
      || this.parent?._getAll(token)
    );
  }

  has(token: Token): boolean {
    return (
      internals.has(token)
      || this._has(token)
    );
  }

  private _has(token: Token): boolean {
    const registrations = this._map.get(token);
    return Boolean(
      registrations?.length
      || this.parent?._has(token),
    );
  }

  set<T>(token: Token<T>, registration: Registration<T>): void {
    assert(!internals.has(token), `cannot register reserved token ${token.name}`);
    let registrations = this._map.get(token);
    if (!registrations) {
      registrations = [];
      this._map.set(token, registrations);
    }
    const existing = registrations.find(
      ({provider}) => provider === registration.provider,
    );
    if (existing) {
      existing.options = {
        ...existing.options,
        ...registration.options,
      };
    }
    else {
      registrations.push(registration);
    }
  }
}

// @internal
export function isBuilder(provider: Provider) {
  return builders.has(provider);
}

/*@__NO_SIDE_EFFECTS__*/
export function Build<Value>(factory: (...args: []) => Value): Type<Value> {
  const token = Type<Value>(`Build<${getTypeName(factory)}>`);
  const provider = {useFactory: factory};
  const options = {scope: Scope.Transient};
  internals.set(token, {provider, options});
  builders.add(provider);
  return token;
}

/*@__NO_SIDE_EFFECTS__*/
export function Value<T>(value: T): Type<T> {
  const token = Type<T>(`Value<${getTypeName(value)}>`);
  const provider = {useValue: value};
  internals.set(token, {provider});
  return token;
}

const internals = new WeakMap<Token, Registration>([
  [Type.Null, {provider: NullProvider}],
  [Type.Undefined, {provider: UndefinedProvider}],
]);

const builders = new WeakSet<Provider>();
