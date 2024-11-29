// @internal
export function createContext<T extends {}>() {
  let current: T | null = null;

  function provide(next: T) {
    const prev = current;
    current = next;
    return () => current = prev;
  }

  function use() {
    return current;
  }

  return [provide, use] as const;
}
