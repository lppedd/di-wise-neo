export const Scope = {
  /**
   * Creates a new value every time the token is resolved.
   */
  Transient: "Transient",

  /**
   * Creates and caches a single value per token resolution graph.
   *
   * The same value is reused during a single resolution request and is subsequently discarded.
   */
  Resolution: "Resolution",

  /**
   * Creates and caches a single value per container.
   *
   * If the value is not found in the current container, it is looked up in the parent container,
   * and so on. It effectively behaves like a _singleton_ scope but allows container-specific overrides.
   */
  Container: "Container",
} as const;

export type Scope = (typeof Scope)[keyof typeof Scope];
