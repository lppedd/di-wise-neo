import { inject } from "./inject";
import { injectAll } from "./injectAll";
import { ensureInjectionContext, provideInjectionContext, useInjectionContext } from "./injectionContext";
import { optional } from "./optional";
import { optionalAll } from "./optionalAll";
import type { Constructor, Token, Type } from "./token";
import { Build } from "./tokenRegistry";

/**
 * Injector API.
 */
export interface Injector {
  /**
   * Injects the instance associated with the given class.
   *
   * Throws an error if the class is not registered in the container.
   */
  inject<Instance extends object>(Class: Constructor<Instance>): Instance;

  /**
   * Injects the value associated with the given token.
   *
   * Throws an error if the token is not registered in the container.
   */
  inject<Value>(token: Token<Value>): Value;

  /**
   * Injects all instances provided by the registrations associated with the given class.
   *
   * Throws an error if the class is not registered in the container.
   */
  injectAll<Instance extends object>(Class: Constructor<Instance>): Instance[];

  /**
   * Injects all values provided by the registrations associated with the given token.
   *
   * Throws an error if the token is not registered in the container.
   */
  injectAll<Value>(token: Token<Value>): NonNullable<Value>[];

  /**
   * Injects the instance associated with the given class,
   * or `undefined` if the class is not registered in the container.
   */
  optional<Instance extends object>(Class: Constructor<Instance>): Instance | undefined;

  /**
   * Injects the value associated with the given token,
   * or `undefined` if the token is not registered in the container.
   */
  optional<Value>(token: Token<Value>): Value | undefined;

  /**
   * Injects all instances provided by the registrations associated with the given class,
   * or an empty array if the class is not registered in the container.
   */
  optionalAll<Instance extends object>(Class: Constructor<Instance>): Instance[];

  /**
   * Injects all values provided by the registrations associated with the given token,
   * or an empty array if the token is not registered in the container.
   */
  optionalAll<Value>(token: Token<Value>): NonNullable<Value>[];
}

/**
 * Injector token for dynamic injections.
 *
 * @example
 * ```ts
 * class Wizard {
 *   private injector = inject(Injector);
 *   private wand?: Wand;
 *
 *   getWand(): Wand {
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
    inject: <T>(token: Token<T>) => withCurrentContext(() => inject(token)),
    injectAll: <T>(token: Token<T>) => withCurrentContext(() => injectAll(token)),
    optional: <T>(token: Token<T>) => withCurrentContext(() => optional(token)),
    optionalAll: <T>(token: Token<T>) => withCurrentContext(() => optionalAll(token)),
  };
});
