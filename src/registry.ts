import {assert} from "./errors";
import {ErrorMessage} from "./errors";
import type {InstanceRef} from "./instance";
import {NullProvider, type Provider, UndefinedProvider} from "./provider";
import {Scope} from "./scope";
import {type Token, Type} from "./token";

export interface Registration<T = any> {
  options?: RegistrationOptions;
  instance?: InstanceRef<T>;
  readonly provider: Provider<T>;
}

export interface RegistrationOptions {
  readonly scope?: Scope;
}

export class Registry {
  private map = new Map<Token, Registration[]>();

  private parent?: Registry;

  constructor(parent?: Registry) {
    this.parent = parent;
  }

  clear(): void {
    this.map.clear();
  }

  delete<T>(token: Token<T>): void {
    this.map.delete(token);
  }

  get<T>(token: Token<T>): Registration<T> | undefined {
    return (
      internals.get(token)
      || this.getRecursive(token)
    );
  }

  private getRecursive<T>(token: Token<T>): Registration<T> | undefined {
    const registrations = this.map.get(token);
    return (
      registrations?.at(-1)
      || this.parent?.getRecursive(token)
    );
  }

  getAll<T>(token: Token<T>): Registration<T>[] | undefined {
    const internal = internals.get(token);
    return (
      (internal && [internal])
      || this.getAllRecursive(token)
    );
  }

  private getAllRecursive<T>(token: Token<T>): Registration<T>[] | undefined {
    const registrations = this.map.get(token);
    return (
      registrations
      || this.parent?.getAllRecursive(token)
    );
  }

  has(token: Token): boolean {
    return (
      internals.has(token)
      || this.hasRecursive(token)
    );
  }

  private hasRecursive(token: Token): boolean {
    const registrations = this.map.get(token);
    return Boolean(
      registrations?.length
      || this.parent?.hasRecursive(token),
    );
  }

  set<T>(token: Token<T>, registration: Registration<T>): void {
    assert(!internals.has(token), ErrorMessage.ReservedToken, token.name);
    let registrations = this.map.get(token);
    if (!registrations) {
      registrations = [];
      this.map.set(token, registrations);
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

  values(): IterableIterator<Registration[]> {
    return this.map.values();
  }
}

export function Build<Value>(factory: (...args: []) => Value): Type<Value> {
  const typeName = getTypeName(factory);
  const token = Type<Value>(`Build<${typeName}>`);
  const registration = {
    provider: {useFactory: factory},
    options: {scope: Scope.Transient},
  };
  internals.set(token, registration);
  return token;
}

export function Value<T>(value: T): Type<T> {
  const typeName = getTypeName(value);
  const token = Type<T>(`Value<${typeName}>`);
  const registration = {
    provider: {useValue: value},
  };
  internals.set(token, registration);
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

const internals = new WeakMap<Token, Registration>([
  [Type.Null, {provider: NullProvider}],
  [Type.Undefined, {provider: UndefinedProvider}],
]);
