import { inject } from "./inject";
import { injectAll } from "./injectAll";
import { ensureInjectionContext, provideInjectionContext, useInjectionContext } from "./injectionContext";
import { optional } from "./optional";
import { optionalAll } from "./optionalAll";
import type { Constructor, Token, Type } from "./token";
import { build } from "./tokenRegistry";

/**
 * Injector API.
 */
export interface Injector {
  /**
   * Injects the instance associated with the given class.
   *
   * Throws an error if the class is not registered in the container.
   */
  inject<Instance extends object>(Class: Constructor<Instance>, name?: string): Instance;

  /**
   * Injects the value associated with the given token.
   *
   * Throws an error if the token is not registered in the container.
   */
  inject<Value>(token: Token<Value>, name?: string): Value;

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
  optional<Instance extends object>(Class: Constructor<Instance>, name?: string): Instance | undefined;

  /**
   * Injects the value associated with the given token,
   * or `undefined` if the token is not registered in the container.
   */
  optional<Value>(token: Token<Value>, name?: string): Value | undefined;

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

  /**
   * Runs a function inside the injection context of this injector.
   *
   * Note that injection functions (`inject`, `injectAll`, `optional`, `optionalAll`)
   * are only usable synchronously: they cannot be called from asynchronous callbacks
   * or after any `await` points.
   *
   * @param fn The function to be run in the context of this injector.
   * @returns The return value of the function, if any.
   */
  runInContext<ReturnType>(fn: () => ReturnType): ReturnType;
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
export const Injector: Type<Injector> = /*@__PURE__*/ build<Injector>(() => {
  const context = ensureInjectionContext("Injector factory");
  const resolution = context.resolution;

  const dependentFrame = resolution.stack.peek();
  const dependentRef = dependentFrame && resolution.dependents.get(dependentFrame.provider);

  const runInContext = <R>(fn: () => R): R => {
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
      cleanups.forEach((cleanup) => cleanup?.());
    }
  };

  return {
    inject: <T>(token: Token<T>, name?: string) => runInContext(() => inject(token, name)),
    injectAll: <T>(token: Token<T>) => runInContext(() => injectAll(token)),
    optional: <T>(token: Token<T>, name?: string) => runInContext(() => optional(token, name)),
    optionalAll: <T>(token: Token<T>) => runInContext(() => optionalAll(token)),
    runInContext,
  };
}, "Injector");
