import {describe, expect, it} from 'vitest'

import {
  Container,
  Deferred,
  Inject,
  Injectable,
  InjectableType,
  InjectionScope,
  Scoped,
} from '..'

describe('Features', () => {
  it('should prioritize inline provider/config', () => {
    const container = new Container()

    interface WithValue {
      value: string
    }
    const WithValue = InjectableType<WithValue>('WithValue')

    @Injectable(WithValue)
    class A implements WithValue {
      value = 'A'
    }

    class B implements WithValue {
      value = 'B'
    }

    class C {
      @Inject({
        token: WithValue,
        useClass: B,
      })
      content!: WithValue
    }

    container.register(A)
    const c = container.resolve(C)
    expect(c.content.value).toBe('B')
  })

  it('should handle circular dependencies', () => {
    const container = new Container()

    interface A {
      b: B
    }
    interface B {
      a: A
    }
    const A = InjectableType<A>('A')
    const B = InjectableType<B>('B')

    @Injectable(B)
    class BImpl {
      @Deferred()
      @Inject(A)
      a!: A

      constructor() {
        expect(this.a).toBeUndefined()
      }
    }

    @Injectable(A)
    class AImpl {
      @Deferred()
      @Inject(B)
      b!: B

      constructor() {
        expect(this.b).toBeUndefined()
      }
    }

    container.register(AImpl)
    container.register(BImpl)

    const a = container.resolve(A)
    expect(a).toBeInstanceOf(AImpl)
    const b = a.b
    expect(b).toBeInstanceOf(BImpl)
    expect(b.a).toBe(a)
  })

  it('should handle resolution scope', () => {
    const container = new Container()

    @Scoped(InjectionScope.Resolution)
    class A {}

    class B {
      @Inject(A)
      a!: A
    }

    class C {
      @Inject(A)
      a!: A

      @Inject(B)
      b!: B
    }

    const c = container.resolve(C)
    expect(c.a).toBeInstanceOf(A)
    expect(c.b).toBeInstanceOf(B)
    expect(c.b.a).toBe(c.a)
  })

  it('should create child containers', () => {
    interface A {
      value: string
    }
    const A = InjectableType<A>('A')

    @Injectable(A)
    class AImpl implements A {
      value = 'A'
    }

    const parent = new Container()
    parent.register({
      token: A,
      useClass: AImpl,
    })

    const child = parent.createChild()
    expect(child.isRegistered(A)).toBe(true)

    const a = child.resolve(A)
    expect(a).toBeInstanceOf(AImpl)
  })

  it('should override config', () => {
    const container = new Container()

    @Scoped(InjectionScope.Transient)
    class A {}

    class B {
      @Inject({
        token: A,
        scope: InjectionScope.Container,
      })
      a!: A
    }

    const b = container.resolve(B)
    expect(container.instanceCache.has(A)).toBe(true)

    const a = container.resolve({
      token: A,
      scope: InjectionScope.Container,
    })
    expect(a).toBe(b.a)
  })
})
