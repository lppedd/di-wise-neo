import type { Container } from "./container";
import { assert } from "./errors";
import type { InstanceRef } from "./instanceRef";
import type { Provider } from "./provider";
import type { Scope } from "./scope";
import { createContext } from "./utils/context";
import { KeyedStack } from "./utils/keyedStack";
import { WeakRefMap } from "./utils/weakRefMap";

export interface ResolutionFrame {
  readonly scope: Exclude<Scope, typeof Scope.Inherited>;
  readonly provider: Provider;
}

export interface Resolution {
  readonly stack: KeyedStack<Provider, ResolutionFrame>;
  readonly instances: WeakRefMap<Provider, InstanceRef>;
  readonly dependents: WeakRefMap<Provider, InstanceRef>;
}

export interface InjectionContext {
  readonly container: Container;
  readonly resolution: Resolution;
}

// @internal
export function createResolution(): Resolution {
  return {
    stack: new KeyedStack(),
    instances: new WeakRefMap(),
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
