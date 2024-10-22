// @internal
export function createContext<T extends {}>() {
  let contextValue: T | null = null;

  function provide<R>(value: T, callback: () => R) {
    const currentValue = contextValue;
    contextValue = value;
    try {
      return callback();
    }
    finally {
      contextValue = currentValue;
    }
  }

  function use() {
    return contextValue;
  }

  return <const>[
    provide,
    use,
  ];
}
