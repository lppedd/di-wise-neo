import type { ParameterDecorator } from "./decorators/decorators";
import { checkSingleDecorator, updateParameterMetadata } from "./decorators/utils";
import type { Provider } from "./provider";
import { tokenRef } from "./tokenRef";
import type { RegistrationOptions } from "./tokenRegistry";
import type { Writable } from "./utils/writable";

/**
 * An injectable type `T`.
 */
export interface Type<T> extends ParameterDecorator {
  /**
   * The type's presentable name, in the `Type<debugName>` format.
   */
  readonly name: string;

  /**
   * The type's debug name, as passed to {@link createType}.
   */
  readonly debugName: string;

  /**
   * Ensures that different `Type<T>` types are not structurally compatible.
   *
   * This property is always `undefined` and is never used at runtime.
   *
   * @private
   */
  readonly __type: T | undefined;
}

/**
 * An injectable type `T` with a default {@link Provider} and optional default registration options.
 */
export interface ProviderType<T> extends Type<T> {
  /**
   * The underlying `Type<T>`.
   */
  readonly type: Type<T>;

  /**
   * The type's default provider.
   */
  readonly provider: Provider<T>;

  /**
   * The type's default registration options.
   */
  readonly options?: RegistrationOptions | undefined;
}

/**
 * Constructor type.
 */
export interface Constructor<Instance extends object> {
  new (...args: any[]): Instance;
  readonly name: string;
}

/**
 * Token type.
 */
export type Token<Value> = [Value] extends [object] // Avoids distributive union behavior
  ? Type<Value> | Constructor<Value & object>
  : Type<Value>;

/**
 * Describes a {@link Token} array with at least one element.
 */
export type Tokens<Value> = [Token<Value>, ...Token<Value>[]];

/**
 * Creates a type token.
 *
 * Example:
 * ```ts
 * const ISpell = createType<Spell>("Spell");
 * container.register(ISpell, {
 *   useFactory: () => getDefaultSpell(),
 * });
 * ```
 */
export function createType<T>(debugName: string): Type<T>;

/**
 * Creates a type token with a default {@link Provider} and optional default registration options.
 *
 * Example:
 * ```ts
 * // Notice how we pass in a Provider directly at type creation site
 * const ISpell = createType<Spell>("Spell", {
 *   useFactory: () => getDefaultSpell(),
 * });
 *
 * container.register(ISpell);
 * ```
 */
export function createType<T>(debugName: string, provider: Provider<T>, options?: RegistrationOptions): ProviderType<T>;

// @__NO_SIDE_EFFECTS__
export function createType<T>(
  debugName: string,
  provider?: Provider<T>,
  options?: RegistrationOptions,
): Type<T> | ProviderType<T> {
  const type = ((target, propertyKey, parameterIndex): void => {
    updateParameterMetadata(debugName, target, propertyKey, parameterIndex, (dependency) => {
      checkSingleDecorator(dependency, target, propertyKey, parameterIndex);
      dependency.appliedBy = "Inject";
      dependency.tokenRef = tokenRef(() => type as Type<T>);
    });
  }) as ParameterDecorator & Writable<ProviderType<T>>;

  const name = `Type<${debugName}>`;
  Object.defineProperty(type, "name", { value: name });
  type.debugName = debugName;
  type.__type = undefined;
  type.toString = () => name;

  if (provider) {
    type.type = type;
    type.provider = provider;
    type.options = options;
  }

  return type;
}

// @internal
export function isConstructor<T>(token: Type<T> | Constructor<T & object>): token is Constructor<T & object> {
  return !("__type" in token);
}
