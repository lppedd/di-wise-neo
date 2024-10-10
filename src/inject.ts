import type {InjectionConfig} from './config'
import {useContainer} from './container'
import {assert, ErrorMessage} from './errors'
import type {Resolvable} from './resolvable'
import type {InjectionToken} from './token'

export function inject<T extends any[]>(config: InjectionConfig<T>): T[number]
export function inject<T>(token: InjectionToken<T>): T
export function inject<T>(resolvable: Resolvable<T>): T
export function inject<T>(resolvable: Resolvable<T>): T {
  const container = useContainer()
  assert(container, ErrorMessage.InjectOutsideOfContext)
  return container.resolve(resolvable)
}

// TODO: Injector
