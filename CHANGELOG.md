# Changelog

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
