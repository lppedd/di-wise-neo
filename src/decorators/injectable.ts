import { getMetadata } from "../metadata";
import type { Constructor, Token, Tokens } from "../token";
import { isTokensRef, ref, type TokensRef } from "../tokensRef";

/**
 * Decorator for adding aliasing tokens to a class when registering it.
 * The container uses {@link ExistingProvider} under the hood.
 *
 * @example
 * ```ts
 * @Injectable(Weapon)
 * class Wand {}
 * ```
 */
export function Injectable<This extends object, Value extends This>(
  ...tokens: Tokens<Value>
): ClassDecorator;

/**
 * Decorator for adding aliasing tokens to a class when registering it.
 * The container uses {@link ExistingProvider} under the hood.
 *
 * Allows referencing tokens that are declared after this usage.
 *
 * @example
 * ```ts
 * @Injectable(() => Weapon) // Weapon is declared after Wand
 * class Wand {}
 * ```
 */
export function Injectable<This extends object, Value extends This>(
  tokens: TokensRef<Value>,
): ClassDecorator;

/**
 * @__NO_SIDE_EFFECTS__
 */
export function Injectable(...args: unknown[]): ClassDecorator {
  return function (Class): void {
    const metadata = getMetadata(Class as any as Constructor<any>);
    const tokensRef = isTokensRef(args[0]) ? args[0] : ref(() => args as Token | Tokens);
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
