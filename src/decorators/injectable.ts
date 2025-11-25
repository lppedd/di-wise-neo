import { getMetadata } from "../metadata";
import type { Token, Tokens } from "../token";
import { isTokenRef, type TokenRef, tokenRef } from "../tokenRef";
import type { ClassDecorator } from "./decorators";

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
export function Injectable<Value, This extends Value & object>(
  token: Token<Value>, //
): ClassDecorator<This>;
export function Injectable<VA, VB, This extends VA & VB & object>(
  tokenA: Token<VA>, //
  tokenB: Token<VB>,
): ClassDecorator<This>;
export function Injectable<VA, VB, VC, This extends VA & VB & VC & object>(
  tokenA: Token<VA>,
  tokenB: Token<VB>,
  tokenC: Token<VC>,
): ClassDecorator<This>;
export function Injectable<VA, VB, VC, VD, This extends VA & VB & VC & VD & object>(
  tokenA: Token<VA>,
  tokenB: Token<VB>,
  tokenC: Token<VC>,
  tokenD: Token<VD>,
): ClassDecorator<This>;
export function Injectable<VA, VB, VC, VD, VE, This extends VA & VB & VC & VD & VE & object>(
  tokenA: Token<VA>,
  tokenB: Token<VB>,
  tokenC: Token<VC>,
  tokenD: Token<VD>,
  tokenE: Token<VE>,
): ClassDecorator<This>;
export function Injectable<VA, VB, VC, VD, VE, VF, This extends VA & VB & VC & VD & VE & VF & object>(
  tokenA: Token<VA>,
  tokenB: Token<VB>,
  tokenC: Token<VC>,
  tokenD: Token<VD>,
  tokenE: Token<VE>,
  tokenF: Token<VF>,
): ClassDecorator<This>;

//
// Use 'unknown' to allow inputting more tokens at the expense of type correctness.
//

export function Injectable<This extends object>(...tokens: Tokens<unknown>): ClassDecorator<This>;

/**
 * Class decorator that registers additional aliasing tokens for the decorated type
 * when the type is first registered in the container.
 *
 * The container uses {@link ExistingProvider} under the hood.
 *
 * Allows referencing tokens that are declared later in the file by using
 * the {@link tokenRef} helper function.
 *
 * @example
 * ```ts
 * @Injectable(tokenRef() => Weapon) // Weapon is declared after Wand
 * class Wizard {}
 * // Other code...
 * class Weapon {}
 * ```
 */
export function Injectable<Value, This extends Value & object>(tokens: TokenRef<Value>): ClassDecorator<This>;

// @__NO_SIDE_EFFECTS__
export function Injectable<This extends object>(...args: [...Tokens<This>] | [TokenRef<This>]): ClassDecorator<This> {
  return function (Class): void {
    const metadata = getMetadata(Class);
    const arg0 = args[0];
    const ref = isTokenRef(arg0) ? arg0 : tokenRef(() => args as Tokens<This>);
    const currentRef = metadata.tokenRef;
    metadata.tokenRef = {
      getRefTokens: () => {
        const existingTokens = currentRef.getRefTokens();

        for (const token of ref.getRefTokens()) {
          existingTokens.add(token);
        }

        return existingTokens;
      },
    };
  };
}
