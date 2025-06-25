<!--suppress HtmlDeprecatedAttribute -->
<div align="center">
  <h1>di-wise-neo</h1>
  <p>Lightweight, type-safe, flexible dependency injection library for TypeScript and JavaScript</p>
  <img src="./.github/images/neo-wall.jpg" title="di-wise-neo" alt="di-wise-neo" style="border: 3px solid black; border-radius: 15px;" />
  <div><sub>yes, I like The Matrix</sub></div>
</div>

> [!NOTE]
>
> **di-wise-neo** is a fork of [di-wise][di-wise] with the goal of providing
> a simpler yet richer API, also thanks to TypeScript's experimental decorators.
> Shout out to [@exuanbo](https://github.com/exuanbo) for the strong foundations!

## Table of Contents

- [Why forking](#why-forking)
- [Installation](#installation)
- [Ergonomics](#ergonomics)
- [Quickstart](#quickstart)
- [Credits](#credits)
- [License](#license)

## Why forking

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

npm:

```sh
npm install @lppedd/di-wise-neo
```

pnpm:

```sh
pnpm add @lppedd/di-wise-neo
```

yarn:

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

  registerCommand(id: string, fn: () => void): void {
    if (this.context.extensionMode !== ExtensionMode.Production) {
      /* ... */
    }
  }

  // Or method injection. The @Optional decorator injects "T | undefined".
  protected withSecretStore(@Optional(SecretStore) store: SecretStore | undefined): void {
    if (store.isSet("key")) {
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
  defaultScope: Scope.Container
});

// Register our managed dependencies into the container
container.register(ExtensionContext)
         .register(SecretStore)
         .register(ContributionRegistrar);

// Get the contribution registrar.
// The container will create a new managed instance for us, with all dependencies injected.
const registrar = container.resolve(ContributionRegistrar);
registrar.registerCommand("my.command", () => { console.log("hey!"); });
```

## Credits

**di-wise-neo** is a fork of [di-wise][di-wise].  
All credits to the original author for focusing on a clean architecture and on code quality.

## License

[MIT License](https://github.com/lppedd/di-wise-neo/blob/main/LICENSE)

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
