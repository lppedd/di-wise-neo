import {ensureInjectionContext, provideInjectionContext, useInjectionContext} from "./injection-context";
import {Build} from "./registry";
import type {Token, TokenList, Type} from "./token";

export function inject<Values extends unknown[]>(...tokens: TokenList<Values>): Values[number];
export function inject<Value>(...tokens: Token<Value>[]): Value {
  const context = ensureInjectionContext(inject);
  return context.container.resolve(...tokens);
}

export declare namespace inject {
  export var by: typeof injectBy;
}

inject.by = injectBy;

export function injectBy<Values extends unknown[]>(thisArg: any, ...tokens: TokenList<Values>): Values[number];
export function injectBy<Value>(thisArg: any, ...tokens: Token<Value>[]): Value {
  const context = ensureInjectionContext(injectBy);

  const currentFrame = context.resolution.stack.peek();
  if (!currentFrame) {
    return inject(...tokens);
  }

  const currentRef = {current: thisArg};
  const cleanup = context.resolution.dependents.set(currentFrame.provider, currentRef);
  try {
    return inject(...tokens);
  }
  finally {
    cleanup();
  }
}

export function injectAll<Values extends unknown[]>(...tokens: TokenList<Values>): NonNullable<Values[number]>[];
export function injectAll<Value>(...tokens: Token<Value>[]): NonNullable<Value>[] {
  const context = ensureInjectionContext(injectAll);
  return context.container.resolveAll(...tokens);
}

export interface Injector {
  inject<Values extends unknown[]>(...tokens: TokenList<Values>): Values[number];
  injectAll<Values extends unknown[]>(...tokens: TokenList<Values>): NonNullable<Values[number]>[];
}

export const Injector: Type<Injector> = /*@__PURE__*/ Build(function Injector() {
  const context = ensureInjectionContext(Injector);

  const dependentFrame = context.resolution.stack.peek();
  const dependentRef = dependentFrame && context.resolution.dependents.get(dependentFrame.provider);

  function withCurrentContext<R>(fn: () => R) {
    if (useInjectionContext()) {
      return fn();
    }
    const cleanups = [
      provideInjectionContext(context),
      dependentFrame && context.resolution.stack.push(dependentFrame.provider, dependentFrame),
      dependentRef && context.resolution.dependents.set(dependentFrame.provider, dependentRef),
    ];
    try {
      return fn();
    }
    finally {
      cleanups.reverse().forEach((cleanup) => cleanup?.());
    }
  }

  return {
    inject: (...tokens) => withCurrentContext(() => inject(...tokens)),
    injectAll: (...tokens) => withCurrentContext(() => injectAll(...tokens)),
  };
});
