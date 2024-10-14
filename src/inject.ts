import {assert, ErrorMessage} from './errors'
import type {Injections} from './injection'
import {useInjectionContext} from './injection-context'

export function inject<Values extends unknown[]>(...injections: Injections<Values>): Values[number] {
  const context = useInjectionContext()
  assert(context, ErrorMessage.InjectOutsideOfContext)
  const container = context.container
  return container.resolve(...injections)
}

export namespace inject {
  export function by<Values extends unknown[]>(thisArg: any, ...injections: Injections<Values>): Values[number] {
    const context = useInjectionContext()
    assert(context, ErrorMessage.InjectOutsideOfContext)
    const resolution = context.resolution
    const currentFrame = resolution.stack.peek()
    assert(currentFrame, ErrorMessage.InvariantViolation)
    resolution.dependents.set(currentFrame.token, thisArg)
    try {
      return inject(...injections)
    }
    finally {
      resolution.dependents.delete(currentFrame.token)
    }
  }
}
