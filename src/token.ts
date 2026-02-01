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
   * The name of the type.
   */
  readonly name: string;

  /**
   * Ensures that different `Type<T>` types are not structurally compatible.
   *
   * This property is always `undefined` and is never used at runtime.
   *
   * @private
   */
  readonly __type: T | undefined;

  /**
   * Returns the type's {@link Type.name|name}.
   */
  readonly toString: () => string;
}

/**
 * An injectable type `T` with a default {@link Provider} and optional default registration options.
 */
export interface ProviderType<T> extends Type<T> {
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
export function createType<T>(typeName: string): Type<T>;

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
export function createType<T>(typeName: string, provider: Provider<T>, options?: RegistrationOptions): ProviderType<T>;

// @__NO_SIDE_EFFECTS__
export function createType<T>(
  typeName: string,
  provider?: Provider<T>,
  options?: RegistrationOptions,
): Type<T> | ProviderType<T> {
  const name = `Type<${typeName}>`;
  const decorator: ParameterDecorator = (target, propertyKey, parameterIndex) => {
    updateParameterMetadata(name, target, propertyKey, parameterIndex, (dependency) => {
      checkSingleDecorator(dependency, target, propertyKey, parameterIndex);
      dependency.appliedBy = "Inject";
      dependency.tokenRef = tokenRef(() => decorator as Type<T>);
    });
  };

  const type = decorator as ParameterDecorator & Writable<ProviderType<T>>;
  Object.defineProperty(type, "name", { value: name });

  if (provider) {
    type.provider = provider;
    type.options = options;
  }

  type.__type = undefined;
  type.toString = () => name;
  return type;
}

// @internal
export function isConstructor<T>(token: Type<T> | Constructor<T & object>): token is Constructor<T & object> {
  return !("__type" in token);
}
