export type ContextProvider<T> = <R>(value: T, callback: () => R) => R
export type ContextConsumer<T> = () => T | null

// @internal
export function createContext<T extends {}>() {
  let contextValue: T | null = null

  const provide: ContextProvider<T> = (value, callback) => {
    const currentValue = contextValue
    contextValue = value
    try {
      return callback()
    }
    finally {
      contextValue = currentValue
    }
  }

  const use: ContextConsumer<T> = () => {
    return contextValue
  }

  return <const>[
    provide,
    use,
  ]
}
