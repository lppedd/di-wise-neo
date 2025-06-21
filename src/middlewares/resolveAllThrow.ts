import { throwUnregisteredError } from "../errors";
import type { Middleware, Token } from "../index";

/**
 * Middleware that makes `resolveAll` throw an error for an unregistered token,
 * instead of the default behavior of returning an empty array.
 *
 * @example
 * ```ts
 * import { resolveAllThrow } from "di-wise/middlewares";
 *
 * const container = applyMiddleware(createContainer(), [resolveAllThrow]);
 * container.resolveAll(NonRegisteredToken); // => Error("[di-wise] unregistered token(s) <NonRegisteredToken>")
 * ```
 */
export const resolveAllThrow: Middleware = (composer) => {
  composer.use("resolveAll", (next) => <T>(...args: Token<T>[]): (T & {})[] => {
    const result = next(...args);

    if (result.length > 0) {
      return result;
    }

    throwUnregisteredError(args);
  });
};
