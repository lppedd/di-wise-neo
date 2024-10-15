import {assert, ErrorMessage} from "./errors";
import {useInjectionContext} from "./injection-context";
import type {InjectionToken, InjectionTokens} from "./token";

export function inject<Values extends unknown[]>(...tokens: InjectionTokens<Values>): Values[number];
export function inject<Value>(...tokens: InjectionToken<Value>[]): Value {
  const context = useInjectionContext();
  assert(context, ErrorMessage.InjectOutsideOfContext);
  const {container} = context;
  return container.resolve(...tokens);
}

export namespace inject {
  export function by<Values extends unknown[]>(thisArg: any, ...tokens: InjectionTokens<Values>): Values[number];
  export function by<Value>(thisArg: any, ...tokens: InjectionToken<Value>[]): Value {
    const context = useInjectionContext();
    assert(context, ErrorMessage.InjectOutsideOfContext);
    const {resolution} = context;
    const currentFrame = resolution.stack.peek();
    assert(currentFrame, ErrorMessage.InvariantViolation);
    resolution.dependents.set(currentFrame.token, thisArg);
    try {
      return inject(...tokens);
    }
    finally {
      resolution.dependents.delete(currentFrame.token);
    }
  }
}
