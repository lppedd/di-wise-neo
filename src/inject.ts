import {useContainer} from './container'
import {assert, ErrorMessage} from './errors'
import type {Resolvable} from './resolvable'

export function inject<T>(resolvable: Resolvable<T>): T {
  const container = useContainer()
  assert(container, ErrorMessage.InjectOutsideOfContext)
  return container.resolve(resolvable)
}

// TODO: Injector
