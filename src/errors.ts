export const ErrorMessage = {
  UnresolvableToken: 'unresolvable token:',
  CircularDependency: 'circular dependency:',
  DeferredWithoutInject: 'deferred without Inject:',
  InjectOutsideOfContext: 'inject outside of context',
} as const

export function assert(condition: unknown, ...args: any[]): asserts condition {
  if (!condition) {
    throw new Error(args.join(' '))
  }
}

export function expectNever(value: never): never {
  throw new TypeError('unexpected value: ' + value)
}
