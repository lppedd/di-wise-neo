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
  readonly scope: Scope;
  readonly provider: Provider;
}

// @internal
export interface Resolution {
  readonly tokens: Token[];
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
    tokens: [],
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

/**
 * Asserts that the current stack frame is within an injection context,
 * meaning it has access to injection functions (`inject`, `optional`, etc.).
 *
 * @param fn The function performing the assertion, or a string name used in the error message.
 * @throws {Error} If the current stack frame is not within an injection context.
 */
export function assertInjectionContext(fn: Function | string): void {
  const name = typeof fn === "function" ? `${fn.name || "<unnamed>"}()` : fn;
  ensureInjectionContext(name);
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
