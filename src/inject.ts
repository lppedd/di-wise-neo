import {ensureInjectionContext} from "./injection-context";
import type {Token, TokenList} from "./token";
import {invariant} from "./utils/invariant";

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
  invariant(currentFrame);
  const provider = currentFrame.provider;
  context.resolution.dependents.set(provider, {current: thisArg});
  try {
    return inject(...tokens);
  }
  finally {
    context.resolution.dependents.delete(provider);
  }
}

export function injectAll<Values extends unknown[]>(...tokens: TokenList<Values>): NonNullable<Values[number]>[];
export function injectAll<Value>(...tokens: Token<Value>[]): NonNullable<Value>[] {
  const context = ensureInjectionContext(injectAll);
  return context.container.resolveAll(...tokens);
}
