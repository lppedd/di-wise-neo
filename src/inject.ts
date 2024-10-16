import {assert, ErrorMessage} from "./errors";
import {useInjectionContext} from "./injection-context";
import type {InjectionToken, InjectionTokens} from "./token";

export function inject<Values extends unknown[]>(...tokens: InjectionTokens<Values>): Values[number];
export function inject<Value>(...tokens: InjectionToken<Value>[]): Value {
  const context = useInjectionContext();
  assert(context, ErrorMessage.InjectOutsideOfContext);
  return context.container.resolve(...tokens);
}

export namespace inject {
  export function by<Values extends unknown[]>(thisArg: any, ...tokens: InjectionTokens<Values>): Values[number];
  export function by<Value>(thisArg: any, ...tokens: InjectionToken<Value>[]): Value {
    const context = useInjectionContext();
    assert(context, ErrorMessage.InjectOutsideOfContext);
    const currentFrame = context.resolution.stack.peek();
    assert(currentFrame, ErrorMessage.InvariantViolation);
    context.resolution.dependents.set(currentFrame.provider, thisArg);
    try {
      return inject(...tokens);
    }
    finally {
      context.resolution.dependents.delete(currentFrame.provider);
    }
  }
}

export function injectAll<Values extends unknown[]>(...tokens: InjectionTokens<Values>): Values[number][];
export function injectAll<Value>(...tokens: InjectionToken<Value>[]): Value[] {
  const context = useInjectionContext();
  assert(context, ErrorMessage.InjectOutsideOfContext);
  return context.container.resolveAll(...tokens);
}
