// @internal
export function createInjectionContext<T extends {}>(): readonly [(next: T) => () => T | null, () => T | null] {
  let current: T | null = null;

  function provide(next: T): () => T | null {
    const prev = current;
    current = next;
    return () => (current = prev);
  }

  function use(): T | null {
    return current;
  }

  return [provide, use] as const;
}
