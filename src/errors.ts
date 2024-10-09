export const ErrorMessages = {
  UnresolvableToken: 'unresolvable token:',
  CircularDependency: 'circular dependency:',
  DeferredWithoutInject: 'deferred without Inject:',
  InjectOutsideOfContext: 'inject outside of context',
}

/** @internal */
export function assert(condition: unknown, ...args: any[]): asserts condition {
  if (!condition) {
    throw new Error(args.join(' '))
  }
}

/** @internal */
export function expectNever(value: never): never {
  throw new TypeError('Unexpected value: ' + value)
}
