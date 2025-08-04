import type { Container } from "./container";
import { check } from "./errors";
import type { Provider } from "./provider";
import type { Scope } from "./scope";
import type { Token } from "./token";
import { KeyedStack } from "./utils/keyedStack";
import { WeakRefMap } from "./utils/weakRefMap";
import type { ValueRef } from "./valueRef";

// @internal
export interface ResolutionFrame {
  readonly scope: Exclude<Scope, typeof Scope.Inherited>;
  readonly provider: Provider;
}

// @internal
export interface Resolution {
  readonly tokenStack: Token[];
  readonly stack: KeyedStack<Provider, ResolutionFrame>;
  readonly values: WeakRefMap<Provider, ValueRef>;
  readonly dependents: WeakRefMap<Provider, ValueRef>;
}

// @internal
export interface InjectionContext {
  readonly container: Container;
  readonly resolution: Resolution;
}

// @internal
export function createResolution(): Resolution {
  return {
    tokenStack: [],
    stack: new KeyedStack(),
    values: new WeakRefMap(),
    dependents: new WeakRefMap(),
  };
}

// @internal
export const [provideInjectionContext, useInjectionContext] = createInjectionContext<InjectionContext>();

// @internal
export function ensureInjectionContext(name: string): InjectionContext {
  const context = useInjectionContext();
  check(context, `${name} can only be invoked within an injection context`);
  return context;
}

function createInjectionContext<T extends {}>(): readonly [(next: T) => () => T | null, () => T | null] {
  let current: T | null = null;

  function provide(next: T): () => T | null {
    const prev = current;
    current = next;
    return () => (current = prev);
  }

  function use(): T | null {
    return current;
  }

  return [provide, use] as const;
}
