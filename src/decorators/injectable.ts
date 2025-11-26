import { getMetadata } from "../metadata";
import type { Token, Tokens } from "../token";
import { isTokenRef, type TokenRef, tokenRef } from "../tokenRef";
import type { ClassDecorator } from "./decorators";

/**
 * Class decorator that registers additional aliasing tokens for the decorated type.
 *
 * The aliases are added using {@link ExistingProvider}(s) when the class is first
 * registered in the container.
 *
 * Example:
 * ```ts
 * @Injectable(Weapon)
 * class Rifle {}
 * ```
 *
 * Note that `@Injectable` decorators can be stacked to add multiple aliases.
 *
 * Example:
 * ```ts
 * @Injectable(Weapon)
 * @Injectable(Gun) // Or just @Injectable(Weapon, Gun)
 * class Rifle {}
 * ```
 */
export function Injectable<Value, This extends Value & object>(token: Token<Value>): ClassDecorator<This>;
export function Injectable<VA, VB, This extends VA & VB & object>(tokenA: Token<VA>, tokenB: Token<VB>): ClassDecorator<This>;
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

/**
 * Class decorator that registers an additional aliasing token for the decorated type.
 *
 * The alias is added using an {@link ExistingProvider} when the class is first
 * registered in the container.
 *
 * This overload allows referencing tokens that are declared later in the file
 * by using the {@link tokenRef} helper function.
 *
 * Example:
 * ```ts
 * @Injectable(tokenRef(() => Weapon)) // Weapon is declared after Rifle
 * class Rifle {}
 * // Other code...
 * const Weapon = createType("Weapon");
 * ```
 *
 * Note that `@Injectable` decorators can be stacked to add multiple aliases.
 *
 * Example:
 * ```ts
 * @Injectable(tokenRef(() => Weapon))
 * @Injectable(Gun)
 * class Rifle {}
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
      getRefToken: () => currentRef.getRefToken(),
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
