import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {Container, inject, InjectableType, InjectionScope} from '..'

describe('inject', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should inject fields', () => {
    const container = new Container()

    class A {
      value = inject(B)
    }

    class B {}

    const a = container.resolve(A)
    expect(a).toBeInstanceOf(A)
    expect(a.value).toBeInstanceOf(B)
  })

  it('should inject constructor parameters', () => {
    const container = new Container()

    class A {
      constructor(public value = inject(B)) {}
    }

    class B {}

    const a = container.resolve(A)
    expect(a.value).toBeInstanceOf(B)
  })

  it('should inject with inline provider', () => {
    const container = new Container()

    class A {
      value = inject({
        token: B,
        useFactory: () => new B(),
      })
    }

    class B {}

    const a = container.resolve(A)
    expect(a.value).toBeInstanceOf(B)
  })

  it('should inject with inline config', () => {
    const container = new Container()

    class A {
      value = inject({
        token: B,
        scope: InjectionScope.Container,
      })
    }

    class B {}

    const a = container.resolve(A)
    expect(a).toBeInstanceOf(A)
    expect(a.value).toBeInstanceOf(B)
    expect(container.instanceCache.get(B)).toBe(a.value)
  })

  it('should error if outside context', () => {
    const container = new Container()

    class A {
      constructor() {
        setTimeout(() => inject(B))
      }
    }

    class B {}

    expect(() => {
      container.resolve(A)
      vi.runAllTimers()
    }).toThrowErrorMatchingInlineSnapshot(`[Error: inject outside of context]`)
  })

  it('should inject in factory function', () => {
    const container = new Container()

    interface B {}
    const B = InjectableType<B>('B')

    class A {
      value = inject({
        token: B,
        useFactory: createB,
      })
    }

    class BImpl {}

    function createB() {
      return inject(BImpl)
    }

    const a = container.resolve(A)
    expect(a.value).toBeInstanceOf(BImpl)
  })

  it('should inject container', () => {
    const container = new Container()

    class A {
      container = inject(Container)
    }

    const a = container.resolve(A)
    expect(a.container).toBe(container)
  })
})
