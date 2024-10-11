import {useContainer} from './container'
import {assert, ErrorMessage} from './errors'
import type {Injections} from './injection'

export function inject<Values extends unknown[]>(...injections: Injections<Values>): Values[number] {
  const container = useContainer()
  assert(container, ErrorMessage.InjectOutsideOfContext)
  return container.resolve(...injections)
}

// TODO: Injector
