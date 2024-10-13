import type {Container} from './container'
import {createContext} from './create-context'
import type {InjectionScope} from './scope'
import type {InjectionToken} from './token'

export interface InjectionContext {
  container: Container
  resolution: Resolution
}

export interface Resolution {
  stack: Stack<InjectionToken, ResolutionFrame>
  instances: Map<InjectionToken, any>
  dependents: Map<InjectionToken, any>
}

// @internal
export class Stack<K, V> {
  #entries = new Array<{key: K, value: V}>()
  #keys = new Set<K>()

  push(key: K, value: V) {
    this.#entries.push({key, value})
    this.#keys.add(key)
  }

  pop() {
    const entry = this.#entries.pop()
    if (entry) {
      this.#keys.delete(entry.key)
      return entry.value
    }
  }

  peek() {
    const entry = this.#entries.at(-1)
    return entry?.value
  }

  has(key: K) {
    return this.#keys.has(key)
  }
}

export interface ResolutionFrame {
  scope: ResolvedScope
  token: InjectionToken
}

export type ResolvedScope = Exclude<
  InjectionScope,
  typeof InjectionScope.Inherited
>

// @internal
export const [withInjectionContext, useInjectionContext] = createContext<InjectionContext>()
