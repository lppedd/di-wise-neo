import {assert} from "./errors";
import {ErrorMessage} from "./errors";
import {type InjectionProvider, NullProvider, UndefinedProvider} from "./provider";
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
  private map = new Map<InjectionToken, Registration[]>();

  private parent?: Registry;

  constructor(parent?: Registry) {
    this.parent = parent;
  }

  clear(): void {
    this.map.clear();
  }

  get<T>(token: InjectionToken<T>): Registration<T> | undefined {
    return (
      internals.get(token)
      || this.getRecursive(token)
    );
  }

  private getRecursive<T>(token: InjectionToken<T>): Registration<T> | undefined {
    const registrations = this.map.get(token);
    return (
      registrations?.at(-1)
      || this.parent?.getRecursive(token)
    );
  }

  getAll<T>(token: InjectionToken<T>): Registration<T>[] | undefined {
    const internal = internals.get(token);
    return (
      (internal && [internal])
      || this.getAllRecursive(token)
    );
  }

  private getAllRecursive<T>(token: InjectionToken<T>): Registration<T>[] | undefined {
    const registrations = this.map.get(token);
    return (
      registrations
      || this.parent?.getAllRecursive(token)
    );
  }

  has(token: InjectionToken): boolean {
    return (
      internals.has(token)
      || this.hasRecursive(token)
    );
  }

  private hasRecursive(token: InjectionToken): boolean {
    const registrations = this.map.get(token);
    return Boolean(
      registrations?.length
      || this.parent?.hasRecursive(token),
    );
  }

  set<T>(token: InjectionToken<T>, registration: Registration<T>): this {
    assert(!internals.has(token), ErrorMessage.ReservedToken, token.name);
    let registrations = this.map.get(token);
    if (!registrations) {
      registrations = [];
      this.map.set(token, registrations);
    }
    if (
      registrations.every(({provider}) =>
        provider !== registration.provider)) {
      registrations.push(registration);
    }
    return this;
  }

  values(): IterableIterator<Registration[]> {
    return this.map.values();
  }
}

export function Build<Value>(factory: (...args: []) => Value): Type<Value> {
  const typeName = getTypeName(factory);
  const token = Type<Value>(`Build<${typeName}>`);
  const provider = {
    useFactory: factory,
    scope: InjectionScope.Transient,
  };
  internals.set(token, {provider});
  return token;
}

export function Value<T>(value: T): Type<T> {
  const typeName = getTypeName(value);
  const token = Type<T>(`Value<${typeName}>`);
  const provider = {
    useValue: value,
  };
  internals.set(token, {provider});
  return token;
}

function getTypeName(value: unknown): string {
  if (typeof value == "string") {
    return `"${value}"`;
  }
  if (typeof value == "function") {
    return (value.name && `typeof ${value.name}`) || "Function";
  }
  if (typeof value == "object") {
    if (value === null) {
      return "null";
    }
    const proto: object = Object.getPrototypeOf(value);
    if (proto === null) {
      return "Object";
    }
    const constructor: unknown = proto.constructor;
    if (typeof constructor == "function" && constructor.name) {
      return constructor.name;
    }
    return "(anonymous)";
  }
  return String(value);
}

const internals = new WeakMap<InjectionToken, Registration>([
  [Type.Null, {provider: NullProvider}],
  [Type.Undefined, {provider: UndefinedProvider}],
]);
