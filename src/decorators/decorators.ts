import { assert } from "../errors";
import { getMetadata } from "../metadata";
import type { Constructor, Token, Tokens } from "../token";
import { isTokensRef, ref } from "./tokensRef";

export function processDecoratedSymbol(
  type: "Inject" | "InjectAll",
  propertyKey: string | symbol | undefined,
  target: object,
  args: unknown[],
  parameterIndex: number | undefined,
): void {
  // Error out immediately if the decorator has been applied
  // to a static property or a static method
  if (propertyKey !== undefined && typeof target === "function") {
    const message = `@${type} cannot be used on static member ${target.name}.${String(propertyKey)}`;
    assert(false, message);
  }

  const tokensRef = isTokensRef(args[0]) //
    ? args[0]
    : ref(() => args as Token | Tokens);

  if (typeof parameterIndex === "number") {
    // Method parameter decorator
    //
    // When propertyKey is undefined, the decorator has been applied to a constructor parameter.
    // Otherwise, it is a standard instance method.
    if (propertyKey === undefined) {
      const metadata = getMetadata(target as Constructor<any>);
      metadata.dependencies.constructor.push({
        tokensRef: tokensRef,
        type: type,
        index: parameterIndex,
      });
    } else {
      const metadata = getMetadata(target.constructor as Constructor<any>);
      const methods = metadata.dependencies.methods;
      let dep = methods.get(propertyKey);

      if (dep === undefined) {
        dep = [];
        methods.set(propertyKey, dep);
      }

      dep.push({
        tokensRef: tokensRef,
        type: type,
        index: parameterIndex,
      });
    }
  } else {
    // Class property decorator
    const metadata = getMetadata(target.constructor as Constructor<any>);
    metadata.dependencies.properties.push({
      tokensRef: tokensRef,
      type: type,
      key: propertyKey!,
    });
  }
}
