import {assert, ErrorMessage} from './errors'
import {type Resolvable, useResolver} from './resolver'

export function inject<T>(resolvable: Resolvable<T>): T {
  const resolver = useResolver()
  assert(resolver, ErrorMessage.InjectOutsideOfContext)
  return resolver.resolve(resolvable)
}
