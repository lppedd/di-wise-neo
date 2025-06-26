<!--suppress HtmlDeprecatedAttribute -->
<div align="center">
  <h1>di-wise-neo</h1>
  <p>Lightweight, type-safe, flexible dependency injection library for TypeScript and JavaScript</p>

[![test](https://img.shields.io/github/actions/workflow/status/lppedd/di-wise-neo/test.yml.svg?branch=main)](https://github.com/lppedd/di-wise-neo/actions/workflows/test.yml)
[![npm](https://img.shields.io/npm/v/@lppedd/di-wise-neo?color=%23de1f1f&logo=npm)](https://www.npmjs.com/package/@lppedd/di-wise-neo)
[![npm gzipped size](https://img.shields.io/bundlejs/size/@lppedd/di-wise-neo)](https://bundlejs.com/?q=@lppedd/di-wise-neo)
[![license](https://img.shields.io/github/license/lppedd/di-wise-neo?color=blue)](https://github.com/lppedd/di-wise-neo/blob/main/LICENSE)

  <img src="./.github/images/neo-wall.jpg" alt="di-wise-neo" style="border: 3px solid black; border-radius: 15px;" />
  <div><sub>yes, I like The Matrix</sub></div>
</div>

> [!NOTE]
>
> **di-wise-neo** is a fork of [di-wise][di-wise], aiming to provide a simpler yet more powerful API,
> in part thanks to TypeScript's experimental decorators. Shout out to [@exuanbo](https://github.com/exuanbo)
> for the strong foundations!

## Table of Contents

- [Why yet another library](#why-yet-another-library)
- [Installation](#installation)
- [Ergonomics](#ergonomics)
- [Quickstart](#quickstart)
- [Container scopes](#container-scopes)
- [Token registration](#token-registration)
- [Function-based injection](#function-based-injection)
- [Decorator-based injection](#decorator-based-injection)
- [Behavioral decorators](#behavioral-decorators)
- [Testing support](#testing-support)

## Why yet another library

I've been developing VS Code extensions for a while as part of my daily work.
It's enjoyable work! However, extensions always reach that tipping point where
feature bloat, and the many different UI interactions which arise from that,
make writing, reading, and understanding the codebase a challenge.

Part of the problem is the crazy amount of parameter passing, and the many exported
global values floating around waiting to be imported and to generate yet another
coupling point.

My background with Java is full of such cases, that have been (partially) mitigated
by introducing dependency-injection libraries based on Java's powerful Contexts and
Dependency Injection (see [Weld][cdi-weld], the reference implementation).

So why not apply the same concept to our TypeScript projects?  
I've posted on Reddit just to get a feel of what the ecosystem offers, and was
pointed to libraries such as [tsyringe][tsyringe], [InversifyJS][InversifyJS], or [Awilix][Awilix].
I've also explored on my own and discovered [redi][redi] and [di-wise][di-wise].

What I was looking for is a lightweight solution that offers:

- full type safety
- scoped resolution of dependencies
- optional decorator support for constructor and method injection.  
  Yes I know, forget type-safety with decorators, but they are extremely
  intuitive to pick up for Java devs.
- no dependency on [reflect-metadata][reflect-metadata], as I'm an ESBuild user
  and ESBuild [does not][esbuild-issue] support `emitDecoratorMetadata`

Unfortunately both [tsyringe][tsyringe] and [InversifyJS][InversifyJS] require
[reflect-metadata][reflect-metadata] to run correctly. [Awilix][Awilix] looks good,
but it's probably too much for what I need to do, and it does not support decorators.
Plus, the API just didn't click for me.

[redi][redi] focuses _only_ on constructor injection via decorators, which is nice.
However, it falls short when it comes to type safety and resolution scopes:
it only supports singletons, with a decorator-based trick to create fresh instances.

And lastly, [di-wise][di-wise]. This small library was quite the surprise! Easy to pick up,
no scope creep, injection context support, and full type safety via Angular-like
`inject<T>()` functions (that's more like a service locator, but whatever).
The only problems are the slightly overcomplicated API - especially regarding typings - and
the use of ECMAScript Stage 3 decorators, which do not support decorating method parameters :sob:

So what's the right move? Forking the best pick and refactoring it to suite my
production needs.

## Installation

```sh
npm i @lppedd/di-wise-neo
```

```sh
pnpm add @lppedd/di-wise-neo
```

```sh
yarn add @lppedd/di-wise-neo
```

## Ergonomics

- Does **not** depend on other libraries
- Does **not** use [reflect-metadata](https://www.npmjs.com/package/reflect-metadata) to drive decorators
- **Can** be used from JavaScript with function-based injection

## Quickstart

```ts
//
// A couple of classes to cover the example
//

export class ExtensionContext { /* ... */ }

// Both the secret store and the contribution registrar
// require the extension context to read and set values

export class SecretStore {
  // We can use function-based injection, which gives us type safety
  readonly context = inject(ExtensionContext);

  // Or even
  // constructor(readonly context = inject(ExtensionContext)) {}

  /* ... */
}

export class ContributionRegistrar {
  // We can also opt to use decorator-based constructor injection
  constructor(@Inject(ExtensionContext) readonly context: ExtensionContext) {}

  /* ... */

  // Or method injection. The @Optional decorator injects "T | undefined".
  protected withSecretStore(@Optional(SecretStore) store: SecretStore | undefined): void {
    if (store?.isSet("key")) {
      /* ... */
    }
  }
}

//
// Using di-wise-neo
//

// Create a new DI container
const container = createContainer({
  // Optionally override the default "transient" registration scope.
  // I prefer to use "container" (a.k.a. singleton) scope, but "transient" is the better default.
  defaultScope: Scope.Container,
});

// Register our managed dependencies in the container
container.register(ExtensionContext)
         .register(SecretStore)
         .register(ContributionRegistrar);

// Get the contribution registrar.
// The container will create a new managed instance for us, with all dependencies injected.
const registrar = container.resolve(ContributionRegistrar);
registrar.registerCommand("my.command", () => { console.log("hey!"); });
```

## Container scopes

The [Container][source-container] supports four **scope** types that determine how and when
values are cached and reused.

### Inherited

Inherits the scope from the requesting (dependent) token.  
If there is no dependent (i.e., during top-level resolution), it behaves like **Transient**.

### Transient

Creates a new value every time the dependency is resolved, which means values are never cached.

- a class registered via `ClassProvider` is instantiated on each resolution
- a factory function registered via `FactoryProvider` is invoked on each resolution
- a value registered via `ValueProvider` is always returned as-is

### Resolution

Creates and caches a single value per resolution graph.  
The same value is reused during a single resolution request, but a new one is created
for each separate request.

### Container

Creates and caches a single value per container.  
If the value is not found in the current container, it is looked up in the parent container,
and so on.

It effectively behaves like a **singleton** scope, but allows container-specific overrides.

## Token registration

The container allows registering tokens via _providers_. The generic usage is:

```ts
container.register(/* ... */);
```

An explicit **scope** can be specified using the third argument, when applicable.  
If omitted, the default scope is **Transient**.

```ts
container.register(token, provider, { scope: Scope.Resolution });
```

### ClassProvider

You can register a class by passing it directly to the `register` method:

```ts
container.register(SecretStore);
```

Alternatively, use an explicit `ClassProvider` object - useful when registering
an interface or abstract type:

```ts
const Store = Type<Store>("Store");
container.register(Store, {
  useClass: SecretStore, // class SecretStore implements Store
});
```

Upon resolving `Store`, the container creates an instance of `SecretStore`,
caching it according to the configured scope.

### FactoryProvider

A lazily computed value can be registered using a factory function:

```ts
const Env = Type<string>("Env")
container.register(Env, {
  useFactory: () => isNode() ? "Node.js" : "browser",
});
```

The factory function is invoked upon token resolution, and its result is cached
according to the configured scope.

### ValueProvider

A static value - always taken as-is and unaffected by scopes - can be registered using:

```ts
const PID = Type<number>("PID");
const processId = spawnProcess();
container.register(PID, {
  useValue: processId,
});
```

This is especially useful when injecting third-party values that are not created
through the DI container.

### ExistingProvider

Registers an alias to another token, allowing multiple identifiers to resolve to the same value.  
Using the previous `PID` example, we can register a `TaskID` alias:

```ts
const TaskID = Type<number>("TaskID");
container.register(TaskID, {
  useExisting: PID,
});
```

The container will translate `TaskID` to `PID` before resolving the value.

## Function-based injection

The primary way to perform dependency injection in **di-wise-neo** is through
functions like `inject(T)`, `injectAll(T)`, `optional(T)`, and `optionalAll(T)`.
This approach is recommended because it preserves full type safety.

### Injection context

All injection functions must be invoked inside an _injection context_, which stores
the currently active container.  
The _injection context_ is available in these situations:

- inside the `constructor` of a class instantiated by the DI container
- in property initializers of such classes
- within factory functions used by `FactoryProvider`

### `inject<T>(Token): T`

Injects the value associated with a token, throwing an error if the token is not
registered in the container.

```ts
export class ProcessManager {
  constructor(readonly rootPID /*: number */ = inject(PID)) {}

  /* ... */
}
```

If `PID` cannot be resolved, a resolution error with detailed information is thrown.

### `injectAll<T>(Token): T[]`

Injects all values associated with a token, throwing an error if the token has
never been registered in the container.

```ts
export class ExtensionContext {
  readonly stores /*: Store[] */ = injectAll(Store);

  /* ... */

  clearStorage(): void {
    this.stores.forEach((store) => store.clear());
  }
}
```

### `optional<T>(Token): T`

Injects the value associated with a token, or `undefined` if the token is not
registered in the container.

```ts
export class ProcessManager {
  constructor(readonly rootPID /*: number | undefined */ = optional(PID)) {}

  /* ... */
}
```

### `optionalAll<T>(Token): T[]`

Injects all values associated with a token, or an **empty array** if the token
has never been registered in the container.

```ts
export class ExtensionContext {
  // The type does not change compared to injectAll(T), but the call does not fail
  readonly stores /*: Store[] */ = optionalAll(Store);

  /* ... */
}
```

## Decorator-based injection

You can also perform dependency injection using TypeScript's experimental decorators.

**di-wise-neo** supports decorating constructor's and instance method's parameters.  
It does not support property injection by design.

### `@Inject(Token)`

Injects the value associated with a token, throwing an error if the token is not
registered in the container.

```ts
export class ProcessManager {
  constructor(@Inject(PID) readonly rootPID: number) {}

  /* ... */

  // The method is called immediately after instance construction
  notifyListener(@Inject(ProcessListener) listeners: ProcessListener): void {
    listener.processStarted(this.rootPID);
  }
}
```

If `PID` cannot be resolved, a resolution error with detailed information is thrown.

### `@InjectAll(Token)`

Injects all values associated with a token, throwing an error if the token has
never been registered in the container.

```ts
export class ExtensionContext {
  constructor(@InjectAll(Store) readonly stores: Store[]) {}

  /* ... */

  clearStorage(): void {
    this.stores.forEach((store) => store.clear());
  }
}
```

### `@Optional(Token)`

Injects the value associated with a token, or `undefined` if the token is not
registered in the container.

```ts
export class ProcessManager {
  constructor(@Optional(PID) readonly rootPID: number | undefined) {}

  /* ... */
}
```

### `@OptionalAll(Token)`

Injects all values associated with a token, or an **empty array** if the token
has never been registered in the container.

```ts
export class ExtensionContext {
  // The type does not change compared to @InjectAll, but construction does not fail
  constructor(@OptionalAll(Store) readonly stores: Store[]) {}

  /* ... */
}
```

### Forward references

Sometimes you may need to reference a token or class that is declared later in the file.  
Normally, attempting to do that would result in a `ReferenceError`:

> ReferenceError: Cannot access 'Store' before initialization

We can work around this problem by using the `forwardRef` helper function:

```ts
export class ExtensionContext {
  constructor(@OptionalAll(forwardRef(() => Store)) readonly stores: Store[]) {}

  /* ... */
}
```

## Behavioral decorators

The library includes two behavioral decorators that influence how classes are registered in the container.
These decorators attach metadata to the class type, which is then interpreted by the container during registration.

### `@Scoped`

Specifies a default scope for the decorated class:

```ts
@Scoped(Scope.Container)
export class ExtensionContext {
  /* ... */
}
```

Applying `@Scoped(Scope.Container)` to the `ExtensionContext` class instructs the DI container
to register it with the **Container** scope by default.

This default can be overridden by explicitly providing registration options:

```ts
container.register(
  ExtensionContext,
  { useClass: ExtensionContext },
  { scope: Scope.Resolution },
);
```

In this example, `ExtensionContext` will be registered with **Resolution** scope instead.

### `@AutoRegister`

Enables automatic registration of the decorated class if it has not been registered explicitly.

```ts
@AutoRegister()
export class ExtensionContext {
  /* ... */
}

// Resolve the class without prior registration. It works!
container.resolve(ExtensionContext);
```

## Testing support

Testing is an important part of software development, and dependency injection is meant to make it easier.  
The container API exposes methods to more easily integrate with testing scenarios.

### `resetRegistry`

Removes all registrations from the container's internal registry, effectively resetting it to its initial state.  
This is useful for ensuring isolation between tests.

```ts
describe("My test suite", () => {
  const container = createContainer();

  afterEach(() => {
    container.resetRegistry();
  });

  /* ... */
});
```

### `dispose`

Another way to ensure isolation between tests is to completely replace the DI container after each test run.  
The **di-wise-neo** container supports being _disposed_, preventing further registrations or resolutions.

```ts
describe("My test suite", () => {
  let container = createContainer();

  afterEach(() => {
    container.dispose();
    container = createContainer();
  });

  /* ... */
});
```

## Credits

**di-wise-neo** is a fork of [di-wise][di-wise].  
All credits to the original author for focusing on a clean architecture and on code quality.

## License

[MIT license](https://github.com/lppedd/di-wise-neo/blob/main/LICENSE)

2025-present [Edoardo Luppi](https://github.com/lppedd)  
2024-2025 [Xuanbo Cheng](https://github.com/exuanbo)

<!-- @formatter:off -->
[cdi-weld]: https://weld.cdi-spec.org
[tsyringe]: https://github.com/microsoft/tsyringe
[Awilix]: https://github.com/jeffijoe/awilix
[InversifyJS]: https://github.com/inversify/InversifyJS
[redi]: https://github.com/wzhudev/redi
[di-wise]: https://github.com/exuanbo/di-wise
[reflect-metadata]: https://github.com/microsoft/reflect-metadata
[esbuild-issue]: https://github.com/evanw/esbuild/issues/257
[source-container]: https://github.com/lppedd/di-wise-neo/blob/main/src/container.ts#L29
