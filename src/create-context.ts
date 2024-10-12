export type ContextProvider<T> = <R>(value: T, callback: () => R) => R
export type ContextConsumer<T> = () => T | null

// @internal
export function createContext<T extends {}>() {
  let contextValue: T | null = null

  const Provider: ContextProvider<T> = (value, callback) => {
    const currentValue = contextValue
    contextValue = value
    try {
      return callback()
    }
    finally {
      contextValue = currentValue
    }
  }

  const Consumer: ContextConsumer<T> = () => {
    return contextValue
  }

  return <const>[
    Provider,
    Consumer,
  ]
}
