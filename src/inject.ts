import {useContainer} from './container'
import {assert, ErrorMessage} from './errors'
import type {Resolvables} from './resolvable'

export function inject<Values extends unknown[]>(...resolvables: Resolvables<Values>): Values[number] {
  const container = useContainer()
  assert(container, ErrorMessage.InjectOutsideOfContext)
  return container.resolve(...resolvables)
}

// TODO: Injector
