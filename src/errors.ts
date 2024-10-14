export const ErrorMessage = {
  ReservedToken: 'reserved token:',
  UnresolvableToken: 'unresolvable token:',
  CircularDependency: 'circular dependency:',
  InvariantViolation: 'invariant violation',
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
