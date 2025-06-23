import { inject } from "./inject";
import { injectAll } from "./injectAll";
import {
  ensureInjectionContext,
  provideInjectionContext,
  useInjectionContext,
} from "./injectionContext";
import { Build } from "./registry";
import type { Constructor, Token, TokenList, Type } from "./token";

/**
 * Injector API.
 */
export interface Injector {
  /**
   * Inject an instance of a class.
   */
  inject<Instance extends object>(Class: Constructor<Instance>): Instance;

  /**
   * Inject the value of a token.
   */
  inject<Value>(token: Token<Value>): Value;

  /**
   * Inject the value of a token, by checking each token in order until a registered one is found.
   */
  inject<Values extends unknown[]>(...tokens: TokenList<Values>): Values[number];

  /**
   * Inject instances of a class with all registered providers.
   */
  injectAll<Instance extends object>(Class: Constructor<Instance>): Instance[];

  /**
   * Inject the values of a token from all its registered providers.
   *
   * The returned array will not contain `null` or `undefined` values.
   */
  injectAll<Value>(token: Token<Value>): NonNullable<Value>[];

  /**
   * Inject the values of a token from all its registered providers,
   * by checking each token in order until a registered one is found.
   *
   * The returned array will not contain `null` or `undefined` values.
   */
  injectAll<Values extends unknown[]>(...tokens: TokenList<Values>): NonNullable<Values[number]>[];
}

/**
 * Injector token for dynamic injection.
 *
 * @example
 * ```ts
 * class Wizard {
 *   private injector = inject(Injector);
 *   private wand?: Wand;
 *
 *   getWand() {
 *     return (this.wand ??= this.injector.inject(Wand));
 *   }
 * }
 *
 * const wizard = container.resolve(Wizard);
 * wizard.getWand(); // => Wand
 * ```
 */
export const Injector: Type<Injector> = /*@__PURE__*/ Build(function Injector() {
  const context = ensureInjectionContext(Injector);
  const resolution = context.resolution;

  const dependentFrame = resolution.stack.peek();
  const dependentRef = dependentFrame && resolution.dependents.get(dependentFrame.provider);

  function withCurrentContext<R>(fn: () => R): R {
    if (useInjectionContext()) {
      return fn();
    }

    const cleanups = [
      provideInjectionContext(context),
      dependentFrame && resolution.stack.push(dependentFrame.provider, dependentFrame),
      dependentRef && resolution.dependents.set(dependentFrame.provider, dependentRef),
    ];

    try {
      return fn();
    } finally {
      for (const cleanup of cleanups) {
        cleanup?.();
      }
    }
  }

  return {
    inject: <T>(...tokens: Token<T>[]) => withCurrentContext(() => inject(...tokens)),
    injectAll: <T>(...tokens: Token<T>[]) => withCurrentContext(() => injectAll(...tokens)),
  };
});
