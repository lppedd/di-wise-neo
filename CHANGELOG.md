# Changelog

## 0.8.1

- Added an error when a constructor or method parameter declares multiple injection decorators.  
  While technically possible, this is functionally incorrect and introduces ambiguity.
- Performed minor internal refactors to improve code readability.

## 0.8.0

- Introduced `Injector.runInContext`, to run code with access to injection functions (`inject`, `optional`, etc.)
  when an injection context is not available.
- Performed various internal cleanups.

## 0.7.2

- Enforced that provider `name` qualifiers cannot be empty or blank.  
  This now aligns with the expectations of the `@Named` decorator.

## 0.7.1

- Fixed missing exports for the `optional`, `optionalBy`, and `optionalAll` injection functions.
- Added missing support for name-qualified tokens in `Injector`.

## 0.7.0

- Introduced support for _named_ tokens.  
  Multiple implementations of the same base type can now be registered and resolved using unique names.
- Added the [@Named](https://github.com/lppedd/di-wise-neo#named) decorator for qualifying classes and dependencies.
- Removed specialized registration methods:
  - `registerClass`
  - `registerFactory`
  - `registerValue`
  - `registerAlias`

  These methods were ultimately redundant and added little value in practice.
- Improved in-code documentation.
- Performed various internal cleanups to improve readability and maintainability.

## 0.6.0

- Converted `@EagerInstantiate` to a decorator factory for consistency and future extensibility.  
  Action: replace all usages of `@EagerInstantiate` with `@EagerInstantiate()`.
- Converted `@AutoRegister` to a decorator factory for consistency and future extensibility.  
  Action: replace all usages of `@AutoRegister` with `@AutoRegister()`.
- Set `@EagerInstantiate()` to automatically assign the decorated class scope to **Container**.
- Reported conflicts when multiple decorators set conflicting scopes.

## 0.5.3

Internal changes for better extensibility.

## 0.5.2

Internal changes for better extensibility.

## 0.5.1

- Avoided unnecessary double resolution when `@EagerInstantiate` is applied to a class.

## 0.5.0

- Added support for eager instantiation during registration via the `@EagerInstantiate` class decorator.

## 0.4.0

- Introduced dedicated methods for each type of registration:
  - `registerClass`
  - `registerFactory`
  - `registerValue`
  - `registerAlias`
- Refactored the codebase to support TypeScript's `erasableSyntaxOnly` compiler option.
- Improved and cleaned up in-code documentation.

## 0.3.2

- Renamed the `Type(...)` factory function to `createType(...)`.
- Renamed the `Build(...)` factory function to `build(...)`.

## 0.3.1

- Improved overload flexibility for `Container.resolve` and `Container.resolveAll`.
- Stopped publishing TypeScript source files alongside compiled JavaScript and type declarations.

## 0.3.0

Initial release of **di-wise-neo**.
