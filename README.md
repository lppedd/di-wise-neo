# di-wise 🧙‍♀️

[![npm](https://img.shields.io/npm/v/di-wise.svg)](https://www.npmjs.com/package/di-wise)
[![npm bundle size](https://img.shields.io/bundlephobia/minzip/di-wise@latest.svg?label=bundle%20size)](https://bundlephobia.com/package/di-wise)
[![GitHub Workflow Status (with branch)](https://img.shields.io/github/actions/workflow/status/exuanbo/di-wise/test.yml.svg?branch=main)](https://github.com/exuanbo/di-wise/actions)
[![Codecov (with branch)](https://img.shields.io/codecov/c/gh/exuanbo/di-wise/main.svg?token=65EfrU4Qnl)](https://app.codecov.io/gh/exuanbo/di-wise/tree/main/src)

Lightweight and flexible dependency injection library for JavaScript and TypeScript, w/wo ECMAScript decorators.

## Installation

```sh
# npm
npm install di-wise

# Yarn
yarn add di-wise

# pnpm
pnpm add di-wise
```

## Features

1. Zero dependencies:

   - No need for [`reflect-metadata`](https://www.npmjs.com/package/reflect-metadata)
   - No TypeScript legacy [`experimentalDecorators`](https://www.typescriptlang.org/tsconfig/#experimentalDecorators) required

1. Modern decorator implementation:

   - Uses ECMAScript Stage 3 proposal Decorators: [tc39/proposal-decorators](https://github.com/tc39/proposal-decorators)
   - Supported by modern transpilers and runtimes (TypeScript [5.0+](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-0.html#decorators), swc [v1.3.47+](https://swc.rs/docs/configuration/compilation#jsctransformdecoratorversion), esbuild [v0.21.0+](https://github.com/evanw/esbuild/releases/tag/v0.21.0))

1. Full control over registration and caching:

   - No hidden root/global container or singleton scope
   - Exposed internal registry for testing and custom usage

1. Context-based DI system inspired by Angular:

   - Use decorators `@Injectable()`, `@Scoped()`, `@AutoRegister()` on classes to define providers
   - Use decorators `@Inject()`, `@InjectAll()` on class fields to inject dependencies
   - Or use functions `inject()`, `injectAll()` with full type inference ✨

   Usage of decorators is optional:

   <!-- prettier-ignore -->
   ```ts
   import {Container, Inject, inject, Injectable, Scope, Scoped, Type} from "di-wise";

   import {Wand} from "./weapons";

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

     // is equivalent to:
     wand = inject(Wand);

     constructor(spell = inject(Spell)) {
       // inject() can be used anywhere during construction
       this.wand.store(spell);
     }
   }

   const container = new Container();
   container.register(Fireball);

   // is equivalent to:
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

1. Flexible token-based injection:

   - Use multiple tokens for resolving, with inferred type as a union ✨
   - Special tokens `Type.Null` and `Type.Undefined` for optional dependencies

   Example:

   ```ts
   import {inject, Type} from "di-wise";

   import {Wand} from "./weapons";

   class Wizard {
     wand = inject(Wand, Type.Null);
     // ^? (property) Wizard.wand: Wand | null
   }
   ```

1. Various injection scopes:

   - `Inherited` (default), `Transient`, `Resolution`, and `Container`
   - Customizable default scope for containers

   Example:

   ```ts
   import {Container, Scope} from "di-wise";

   export const singletons = new Container({
     defaultScope: Scope.Container,
     autoRegister: true,
   });
   ```

   `Inherited` will be resolved as `Transient` for a top-level dependent.

   `Resolution` is similar to `Transient`, but the same instance will be reused during a single resolution tree.

1. Automatic circular dependency resolution with `@Inject()` or `inject.by()`:

   ```ts
   import {Container, Inject, inject} from "di-wise";

   class Wand {
     owner = inject(Wizard);
   }

   class Wizard {
     @Inject(Wand)
     wand!: Wand;

     // is equivalent to:
     wand = inject.by(this, Wand);
   }

   const container = new Container();
   const wizard = container.resolve(Wizard);

   expect(wizard.wand.owner).toBe(wizard);
   ```

1. Multiple provider types:

   - `ClassProvider`, `FactoryProvider`, `ValueProvider`
   - Helper functions `Build()` and `Value()` for registering one-off providers

   Example:

   ```ts
   import {Build, Container, inject, Value} from "di-wise";

   import {Cloak} from "./equipments";
   import {Wand} from "./weapons";

   class Wizard {
     equipment = inject(
       Cloak,
       // fallback to a default value
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

   const container = new Container();

   const wizard = container.resolve(
     Build(() => {
       // inject() can be used in factory functions
       const wand = inject(Wand);
       return new Wizard(wand);
     }),
   );

   wizard.equipment.activate(); // => 👻
   ```

## Usage

🏗️ WIP (PR welcome)

## API

See [API documentation](https://exuanbo.github.io/di-wise/modules.html).

## License

[MIT License](https://github.com/exuanbo/di-wise/blob/main/LICENSE) @ 2024-Present [Xuanbo Cheng](https://github.com/exuanbo)
