import { check, getTokenName } from "../errors";
import { getMetadata, type ScopeDecorator } from "../metadata";
import type { Scope } from "../scope";
import type { Constructor } from "../token";
import type { ClassDecorator } from "./decorators";

/**
 * Class decorator that registers the decorated type with the **Container** scope.
 *
 * Use this scope when you want one cached instance per container,
 * with parent-container lookup fallback.
 *
 * Example:
 * ```ts
 * @ContainerScoped
 * class Wizard {
 *   // ...
 * }
 * ```
 */
// @__NO_SIDE_EFFECTS__
export function ContainerScoped<This extends object, Ctor extends Constructor<This>>(target: Ctor): void {
  scoped(target, "Container", "ContainerScoped");
}

/**
 * Class decorator that registers the decorated type with the **Resolution** scope.
 *
 * Use this scope when you want one cached instance per resolution graph,
 * so repeated resolutions within the same request reuse the same value.
 *
 * Example:
 * ```ts
 * @ResolutionScoped
 * class Wand {
 *   // ...
 * }
 * ```
 */
// @__NO_SIDE_EFFECTS__
export function ResolutionScoped<This extends object, Ctor extends Constructor<This>>(target: Ctor): void {
  scoped(target, "Resolution", "ResolutionScoped");
}

/**
 * Class decorator that registers the decorated type with the **Transient** scope.
 *
 * Use this scope when you want a fresh instance every time the class is resolved.
 *
 * Example:
 * ```ts
 * @TransientScoped
 * class Wand {
 *   // ...
 * }
 * ```
 */
// @__NO_SIDE_EFFECTS__
export function TransientScoped<This extends object, Ctor extends Constructor<This>>(target: Ctor): void {
  scoped(target, "Transient", "TransientScoped");
}

/**
 * Class decorator for setting the scope of the decorated type when registering it.
 *
 * The scope set by this decorator can be overridden by explicit registration options, if provided.
 *
 * Example:
 * ```ts
 * @Scoped("Container")
 * class Wizard {}
 *
 * container.register(Wizard);
 *
 * // Under the hood
 * container.register(
 *   Wizard,
 *   { useClass: Wizard },
 *   { scope: "Container" },
 * );
 * ```
 */
// @__NO_SIDE_EFFECTS__
export function Scoped<This extends object>(scope: Scope): ClassDecorator<This> {
  return (target) => scoped(target, scope, "Scoped");
}

function scoped<This extends object>(target: Constructor<This>, scope: Scope, decorator: ScopeDecorator): void {
  const metadata = getMetadata(target);
  const currentScope = metadata.scope;
  check(!currentScope || currentScope.value === scope, () => {
    const { value, appliedBy } = currentScope!;
    const by = appliedBy === "Scoped" ? `${appliedBy}(${value})` : appliedBy;
    const className = getTokenName(target);
    return (
      `class ${className}: scope ${value} was already set by @${by},\n  ` +
      `but @${decorator} is trying to set a conflicting scope ${scope}.\n  ` +
      `Only one decorator should set the class scope, or all must use the same value.`
    );
  });

  metadata.scope = {
    value: scope,
    appliedBy: decorator,
  };
}
