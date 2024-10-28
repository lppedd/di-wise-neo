# di-wise 🧙‍♀️

[![npm](https://img.shields.io/npm/v/di-wise.svg?labelColor=red&color=black)](https://www.npmjs.com/package/di-wise)
[![JSR Version](https://img.shields.io/jsr/v/%40exuanbo/di-wise.svg?labelColor=rgb(247%2C223%2C30)&color=rgb(8%2C51%2C68))](https://jsr.io/@exuanbo/di-wise)
[![npm bundle size](https://img.shields.io/bundlephobia/minzip/di-wise@latest.svg?label=bundle%20size)](https://bundlephobia.com/package/di-wise)
[![GitHub Workflow Status (with branch)](https://img.shields.io/github/actions/workflow/status/exuanbo/di-wise/test.yml.svg?branch=main)](https://github.com/exuanbo/di-wise/actions)
[![Codecov (with branch)](https://img.shields.io/codecov/c/gh/exuanbo/di-wise/main.svg?token=65EfrU4Qnl)](https://app.codecov.io/gh/exuanbo/di-wise/tree/main/src)

Lightweight and flexible dependency injection library for JavaScript and TypeScript, w/wo ECMAScript decorators.

## Table of Contents

- [di-wise 🧙‍♀️](#di-wise-️)
  - [Table of Contents](#table-of-contents)
  - [Installation](#installation)
  - [Features](#features)
    - [Zero dependencies](#zero-dependencies)
    - [Modern decorator implementation](#modern-decorator-implementation)
    - [Context-based DI system](#context-based-di-system)
    - [Multiple provider types](#multiple-provider-types)
    - [Hierarchical injection](#hierarchical-injection)
    - [Full control over registration and caching](#full-control-over-registration-and-caching)
    - [Various injection scopes](#various-injection-scopes)
    - [Flexible token-based injection](#flexible-token-based-injection)
    - [Automatic circular dependency resolution](#automatic-circular-dependency-resolution)
    - [Dynamic injection](#dynamic-injection)
    - [Middleware](#middleware)
  - [Usage](#usage)
  - [API](#api)
  - [Credits](#credits)
  - [License](#license)

## Installation

```sh
npm install di-wise

pnpm add di-wise

yarn add di-wise
```

Also available on [JSR](https://jsr.io/@exuanbo/di-wise):

```sh
deno add jsr:@exuanbo/di-wise
```

## Features

### Zero dependencies

- No need for [`reflect-metadata`](https://www.npmjs.com/package/reflect-metadata)
- No TypeScript legacy [`experimentalDecorators`](https://www.typescriptlang.org/tsconfig/#experimentalDecorators) required

### Modern decorator implementation

- Built on ECMAScript Stage 3 Decorators: [tc39/proposal-decorators](https://github.com/tc39/proposal-decorators)
- Native support in TypeScript [5.0+](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-0.html#decorators), swc [1.3.47+](https://swc.rs/docs/configuration/compilation#jsctransformdecoratorversion), and esbuild [0.21.0+](https://github.com/evanw/esbuild/releases/tag/v0.21.0)

### Context-based DI system

- Flexible decorator-based or function-based injection
- Full type inference support ✨
- Optional decorators with equivalent function alternatives

Example:

<!-- prettier-ignore -->
```ts
import {createContainer, Inject, inject, Injectable, Scope, Scoped, Type} from "di-wise";

interface Spell {
  cast(): void;
}
const Spell = Type<Spell>("Spell");

@Scoped(Scope.Container)
@Injectable(Spell)
class Fireball implements Spell {
  cast() {
    console.log("🔥");
  }
}

class Wizard {
  @Inject(Wand)
  wand!: Wand;

  // Equivalent to
  wand = inject(Wand);

  constructor(spell = inject(Spell)) {
    // inject() can be used anywhere during construction
    this.wand.store(spell);
  }
}

const container = createContainer();
container.register(Fireball);

// Under the hood
[Fireball, Spell].forEach((token) => {
  container.register(
    token,
    {useClass: Fireball},
    {scope: Scope.Container},
  );
});

const wizard = container.resolve(Wizard);
wizard.wand.activate(); // => 🔥
```

### Multiple provider types

- Class, Factory, and Value providers
- Built-in helpers for one-off providers: `Build()`, `Value()`
- Seamless integration with existing classes

Example:

```ts
import {Build, createContainer, inject, Value} from "di-wise";

class Wizard {
  equipment = inject(
    Cloak,
    // Provide a default value
    Value({
      activate() {
        console.log("👻");
      },
    }),
  );

  wand: Wand;

  constructor(wand: Wand) {
    this.wand = wand;
  }
}

const container = createContainer();

const wizard = container.resolve(
  Build(() => {
    // inject() can be used in factory functions
    const wand = inject(Wand);
    return new Wizard(wand);
  }),
);

wizard.equipment.activate(); // => 👻
```

### Hierarchical injection

- Parent-child container relationships
- Automatic token resolution through the container hierarchy
- Isolated registration with shared dependencies

Example:

<!-- prettier-ignore -->
```ts
import {createContainer, inject, Injectable, Type} from "di-wise";

const MagicSchool = Type<string>("MagicSchool");
const Spell = Type<{cast(): void}>("Spell");

// Parent container with shared config
const hogwarts = createContainer();
hogwarts.register(MagicSchool, {useValue: "Hogwarts"});

@Injectable(Spell)
class Fireball {
  school = inject(MagicSchool);
  cast() {
    console.log(`🔥 from ${this.school}`);
  }
}

// Child containers with isolated spells
const gryffindor = hogwarts.createChild();
gryffindor.register(Fireball);

const slytherin = hogwarts.createChild();
slytherin.register(Spell, {
  useValue: {cast: () => console.log("🐍")},
});

gryffindor.resolve(Spell).cast(); // => 🔥 from Hogwarts
slytherin.resolve(Spell).cast();  // => 🐍
```

### Full control over registration and caching

- Explicit container management without global state
- Fine-grained control over instance lifecycle
- Transparent registry access for testing

### Various injection scopes

- Flexible scoping system: `Inherited` (default), `Transient`, `Resolution`, `Container`
- Smart scope resolution for dependencies
- Configurable default scopes per container

Example:

```ts
import {createContainer, Scope} from "di-wise";

export const singletons = createContainer({
  defaultScope: Scope.Container,
  autoRegister: true,
});
```

`Inherited` will be resolved as `Transient` for a top-level dependent.

`Resolution` is similar to `Transient`, but the instance will be reused in a single resolution graph.

### Flexible token-based injection

- Multiple token resolution with union type inference ✨
- Support for optional dependencies via `Type.Null` and `Type.Undefined`
- Interface-based token system

Example:

```ts
import {inject, Type} from "di-wise";

class Wizard {
  wand = inject(Wand, Type.Null);
  // ^? (property) Wizard.wand: Wand | null
}
```

### Automatic circular dependency resolution

- Smart handling of circular dependencies
- Multiple resolution strategies (`@Inject()` or `inject.by()`)
- Maintains type safety

Example:

```ts
import {createContainer, Inject, inject} from "di-wise";

class Wand {
  owner = inject(Wizard);
}

class Wizard {
  @Inject(Wand)
  wand!: Wand;

  // Equivalent to
  wand = inject.by(this, Wand);
}

const container = createContainer();
const wizard = container.resolve(Wizard);

expect(wizard.wand.owner).toBe(wizard);
```

### Dynamic injection

- On-demand dependency resolution via `Injector`
- Context-aware lazy loading
- Preserves proper scoping and circular dependency handling

Example:

```ts
import {createContainer, inject, Injector} from "di-wise";

class Wizard {
  private injector = inject(Injector);
  private wand?: Wand;

  getWand() {
    // Lazy load wand only when needed
    return (this.wand ??= this.injector.inject(Wand));
  }

  castAllSpells() {
    // Get all registered spells
    const spells = this.injector.injectAll(Spell);
    spells.forEach((spell) => spell.cast());
  }
}

const container = createContainer();
const wizard = container.resolve(Wizard);

wizard.getWand(); // => Wand
```

The injector maintains the same resolution context as its injection point, allowing proper handling of scopes and circular dependencies:

```ts
class Wand {
  owner = inject(Wizard);
}

class Wizard {
  private injector = inject.by(this, Injector);

  getWand() {
    return this.injector.inject(Wand);
  }
}

const wizard = container.resolve(Wizard);
const wand = wizard.getWand();

expect(wand.owner).toBe(wizard);
```

### Middleware

- Extensible container behavior through middleware
- Composable middleware chain with predictable execution order
- Full access to container lifecycle

Example:

```ts
import {applyMiddleware, createContainer, type Middleware} from "di-wise";

const logger: Middleware = (composer, _api) => {
  composer
    .use("resolve", (next) => (token) => {
      console.log("Resolving:", token.name);
      const result = next(token);
      console.log("Resolved:", token.name);
      return result;
    })
    .use("resolveAll", (next) => (token) => {
      console.log("Resolving all:", token.name);
      const result = next(token);
      console.log("Resolved all:", token.name);
      return result;
    });
};

const performanceTracker: Middleware = (composer, _api) => {
  composer.use("resolve", (next) => (token) => {
    const start = performance.now();
    const result = next(token);
    const end = performance.now();
    console.log(`Resolution time for ${token.name}: ${end - start}ms`);
    return result;
  });
};

const container = applyMiddleware(createContainer(), [logger, performanceTracker]);

// Use the container with applied middlewares
const wizard = container.resolve(Wizard);
```

Middlewares are applied in array order but execute in reverse order, allowing outer middlewares to wrap and control the behavior of inner middlewares.

## Usage

🏗️ WIP (PR welcome)

## API

See [API documentation](https://exuanbo.github.io/di-wise/modules.html).

## Credits

Inspired by:

- [jeffijoe/awilix](https://github.com/jeffijoe/awilix)
- [inversify/InversifyJS](https://github.com/inversify/InversifyJS)
- [microsoft/tsyringe](https://github.com/microsoft/tsyringe)

## License

[MIT License](https://github.com/exuanbo/di-wise/blob/main/LICENSE) @ 2024-Present [Xuanbo Cheng](https://github.com/exuanbo)
