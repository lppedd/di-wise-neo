// @internal
export function createContext<T extends {}>() {
  let current: T | null = null;

  function provide<R>(next: T, fn: () => R) {
    const prev = current;
    try {
      current = next;
      return fn();
    }
    finally {
      current = prev;
    }
  }

  function use() {
    return current;
  }

  return <const>[
    provide,
    use,
  ];
}
