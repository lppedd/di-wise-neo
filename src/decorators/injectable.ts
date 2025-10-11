import { getMetadata } from "../metadata";
import type { Constructor, Tokens } from "../token";
import { forwardRef, isTokensRef, type TokenRef, type TokensRef } from "../tokensRef";

/**
 * Class decorator that registers additional aliasing tokens for the decorated type
 * when the type is first registered in the container.
 *
 * The container uses {@link ExistingProvider} under the hood.
 *
 * @example
 * ```ts
 * @Injectable(Weapon)
 * class Wand {}
 * ```
 */
export function Injectable<This extends object, Value extends This>(...tokens: Tokens<Value>): ClassDecorator;

/**
 * Class decorator that registers additional aliasing tokens for the decorated type
 * when the type is first registered in the container.
 *
 * The container uses {@link ExistingProvider} under the hood.
 *
 * Allows referencing tokens that are declared later in the file by using
 * the {@link forwardRef} helper function.
 *
 * @example
 * ```ts
 * @Injectable(forwardRef() => Weapon) // Weapon is declared after Wand
 * class Wizard {}
 * // Other code...
 * class Weapon {}
 * ```
 */
export function Injectable<This extends object, Value extends This>(tokens: TokenRef<Value> | TokensRef<Value>): ClassDecorator;

/**
 * @__NO_SIDE_EFFECTS__
 */
export function Injectable(...args: unknown[]): ClassDecorator {
  return function (Class): void {
    const metadata = getMetadata(Class as any as Constructor<any>);
    const arg0 = args[0];
    const tokensRef = isTokensRef(arg0) ? arg0 : forwardRef(() => args as Tokens);
    const existingTokensRef = metadata.tokensRef;
    metadata.tokensRef = {
      getRefTokens: () => {
        const existingTokens = existingTokensRef.getRefTokens();

        for (const token of tokensRef.getRefTokens()) {
          existingTokens.add(token);
        }

        return existingTokens;
      },
    };
  };
}
