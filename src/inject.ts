import {useContainer} from './container'
import {assert, ErrorMessage} from './errors'
import type {Injections} from './injection'
import {useResolutionContext} from './resolution-context'

export function inject<Values extends unknown[]>(...injections: Injections<Values>): Values[number] {
  const container = useContainer()
  assert(container, ErrorMessage.InjectOutsideOfContext)
  return container.resolve(...injections)
}

// HACK: workaround with flag --isolatedDeclarations
// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace inject {
  export function call<Values extends unknown[]>(thisArg: any, ...injections: Injections<Values>): Values[number] {
    const context = useResolutionContext()
    const token = context?.stack[context.stack.length - 1]
    assert(token, ErrorMessage.InjectOutsideOfContext)
    context.dependents.set(token, thisArg)
    try {
      return inject(...injections)
    }
    finally {
      context.dependents.delete(token)
    }
  }
}
