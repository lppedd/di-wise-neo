import { assert } from "../errors";
import { getMetadata } from "../metadata";
import type { Constructor, Token, Tokens } from "../token";
import { isTokensRef, ref } from "./tokensRef";

export function processDecoratedParameter(
  type: "Inject" | "InjectAll",
  args: unknown[],
  target: object,
  propertyKey: string | symbol | undefined,
  parameterIndex: number,
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

  if (propertyKey === undefined) {
    // Constructor
    const metadata = getMetadata(target as Constructor<any>);
    metadata.dependencies.constructor.push({
      tokensRef: tokensRef,
      type: type,
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
      tokensRef: tokensRef,
      type: type,
      index: parameterIndex,
    });
  }
}
