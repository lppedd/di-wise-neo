import type { Container } from "./container";

/**
 * Composer API for middleware functions.
 */
export interface MiddlewareComposer {
  /**
   * Add a middleware function to the composer.
   */
  use<MethodKey extends keyof Container>(
    key: MethodKey,
    wrap: Container[MethodKey] extends Function
      ? (next: Container[MethodKey]) => Container[MethodKey]
      : never,
  ): MiddlewareComposer;
}

/**
 * Middleware function that can be used to extend the container.
 *
 * @example
 * ```ts
 * const logger: Middleware = (composer, _api) => {
 *   composer
 *     .use("resolve", (next) => (...args) => {
 *       console.log("resolve", args);
 *       return next(...args);
 *     })
 *     .use("resolveAll", (next) => (...args) => {
 *       console.log("resolveAll", args);
 *       return next(...args);
 *     });
 * };
 * ```
 */
export interface Middleware {
  (composer: MiddlewareComposer, api: Readonly<Container>): void;
}

/**
 * Apply middleware functions to a container.
 *
 * Middlewares are applied in array order, but execute in reverse order.
 *
 * @example
 * ```ts
 * const container = applyMiddleware(
 *   createContainer(),
 *   [A, B],
 * );
 * ```
 *
 * The execution order will be:
 *
 * 1. B before
 * 2. A before
 * 3. original function
 * 4. A after
 * 5. B after
 *
 * This allows outer middlewares to wrap and control the behavior of inner middlewares.
 */
export function applyMiddleware(container: Container, middlewares: Middleware[]): Container {
  const composer: MiddlewareComposer = {
    use(key, wrap): MiddlewareComposer {
      // We need to bind the 'this' context of the function to the container
      // before passing it to the middleware wrapper.
      //
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-call
      const fn = (container[key] as any).bind(container);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      container[key] = wrap(fn);
      return composer;
    },
  };

  const api = (container.api ||= { ...container });

  for (const middleware of middlewares) {
    middleware(composer, api);
  }

  return container;
}
