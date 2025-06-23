import type { Container } from "./container";
import { assert } from "./errors";
import type { Provider } from "./provider";
import type { Scope } from "./scope";
import { createContext } from "./utils/context";
import { KeyedStack } from "./utils/keyedStack";
import { WeakRefMap } from "./utils/weakRefMap";
import type { ValueRef } from "./valueRef";

export interface ResolutionFrame {
  readonly scope: Exclude<Scope, typeof Scope.Inherited>;
  readonly provider: Provider;
}

export interface Resolution {
  readonly stack: KeyedStack<Provider, ResolutionFrame>;
  readonly values: WeakRefMap<Provider, ValueRef>;
  readonly dependents: WeakRefMap<Provider, ValueRef>;
}

export interface InjectionContext {
  readonly container: Container;
  readonly resolution: Resolution;
}

// @internal
export function createResolution(): Resolution {
  return {
    stack: new KeyedStack(),
    values: new WeakRefMap(),
    dependents: new WeakRefMap(),
  };
}

// @internal
export const [provideInjectionContext, useInjectionContext] = createContext<InjectionContext>();

// @internal
export function ensureInjectionContext(fn: Function): InjectionContext {
  const context = useInjectionContext();
  assert(context, `${fn.name}() can only be invoked within an injection context`);
  return context;
}
