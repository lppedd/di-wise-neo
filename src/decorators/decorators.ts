import { assert } from "../errors";
import { getMetadata } from "../metadata";
import type { Constructor, Token } from "../token";
import type { Decorator } from "../tokenRegistry";
import { forwardRef, isTokenRef, type TokenRef } from "../tokensRef";

export function processDecoratedParameter(
  decorator: Decorator,
  token: Token | TokenRef,
  target: object,
  propertyKey: string | symbol | undefined,
  parameterIndex: number,
): void {
  // Error out immediately if the decorator has been applied
  // to a static property or a static method
  if (propertyKey !== undefined && typeof target === "function") {
    assert(false, `@${decorator} cannot be used on static member ${target.name}.${String(propertyKey)}`);
  }

  const tokenRef = isTokenRef(token) ? token : forwardRef(() => token);

  if (propertyKey === undefined) {
    // Constructor
    const metadata = getMetadata(target as Constructor<any>);
    metadata.dependencies.constructor.push({
      decorator: decorator,
      tokenRef: tokenRef,
      index: parameterIndex,
    });
  } else {
    // Normal instance method
    const metadata = getMetadata(target.constructor as Constructor<any>);
    const methods = metadata.dependencies.methods;
    let dep = methods.get(propertyKey);

    if (dep === undefined) {
      dep = [];
      methods.set(propertyKey, dep);
    }

    dep.push({
      decorator: decorator,
      tokenRef: tokenRef,
      index: parameterIndex,
    });
  }
}
