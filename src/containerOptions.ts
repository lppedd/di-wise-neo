import type { Scope } from "./scope";

/**
 * Options for creating a container.
 */
export interface ContainerOptions {
  /**
   * Whether to automatically register a class when resolving it as a token.
   *
   * @defaultValue false
   */
  readonly autoRegister: boolean;

  /**
   * The default scope for registrations.
   *
   * @defaultValue Scope.Inherited
   */
  readonly defaultScope: Scope;
}
