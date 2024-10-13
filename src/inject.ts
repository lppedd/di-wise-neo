import {useContainer} from './container'
import {assert, ErrorMessage} from './errors'
import type {Injections} from './injection'
import {useResolutionContext} from './resolution-context'

export function inject<Values extends unknown[]>(...injections: Injections<Values>): Values[number] {
  const container = useContainer()
  assert(container, ErrorMessage.InjectOutsideOfContext)
  return container.resolve(...injections)
}

export namespace inject {
  export function by<Values extends unknown[]>(thisArg: any, ...injections: Injections<Values>): Values[number] {
    const context = useResolutionContext()
    const currentFrame = context?.stack[context.stack.length - 1]
    assert(currentFrame, ErrorMessage.InjectOutsideOfContext)
    context.dependents.set(currentFrame.token, thisArg)
    try {
      return inject(...injections)
    }
    finally {
      context.dependents.delete(currentFrame.token)
    }
  }
}
