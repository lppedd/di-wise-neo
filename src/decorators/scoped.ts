import { check, getTokenName } from "../errors";
import { getMetadata, type ScopeDecorator } from "../metadata";
import type { Scope } from "../scope";
import type { ClassDecorator } from "./decorators";

/**
 * Class decorator that registers the decorated type with the **Container** scope.
 *
 * Use this scope when you want one cached instance per container,
 * with parent-container lookup fallback.
 *
 * Example:
 * ```ts
 * @ContainerScoped()
 * class Wizard {
 *   // ...
 * }
 * ```
 */
// @__NO_SIDE_EFFECTS__
export function ContainerScoped<This extends object>(): ClassDecorator<This> {
  return scoped("Container", "ContainerScoped");
}

/**
 * Class decorator that registers the decorated type with the **Resolution** scope.
 *
 * Use this scope when you want one cached instance per resolution graph,
 * so repeated resolutions within the same request reuse the same value.
 *
 * Example:
 * ```ts
 * @ResolutionScoped()
 * class Wand {
 *   // ...
 * }
 * ```
 */
// @__NO_SIDE_EFFECTS__
export function ResolutionScoped<This extends object>(): ClassDecorator<This> {
  return scoped("Resolution", "ResolutionScoped");
}

/**
 * Class decorator that registers the decorated type with the **Transient** scope.
 *
 * Use this scope when you want a fresh instance every time the class is resolved.
 *
 * Example:
 * ```ts
 * @TransientScoped()
 * class Wand {
 *   // ...
 * }
 * ```
 */
// @__NO_SIDE_EFFECTS__
export function TransientScoped<This extends object>(): ClassDecorator<This> {
  return scoped("Transient", "TransientScoped");
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
  return scoped(scope, "Scoped");
}

function scoped<This extends object>(scope: Scope, decorator: ScopeDecorator): ClassDecorator<This> {
  return (Class): void => {
    const metadata = getMetadata(Class);
    const currentScope = metadata.scope;
    check(!currentScope || currentScope.value === scope, () => {
      const { value, appliedBy } = currentScope!;
      const by = appliedBy === "Scoped" ? `${appliedBy}(${value})` : appliedBy;
      const className = getTokenName(Class);
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
  };
}
