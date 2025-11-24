# Changelog

## 0.18.0

- Fixed the handling of `ChildContainerOptions.copyHooks`.  
  The option is now applied correctly when creating child containers.
- Added optional disposal of values provided via `ValueProvider`.  
  The lifecycle of these values is normally managed outside the scope of the container,
  but you can now delegate their disposal to the container, when it is disposed itself.
  Enable this behavior with `ContainerOptions.disposeUnmanaged`:

  ```ts
  const container = createContainer({
    disposeUnmanaged: true,
  });
  ```

## 0.17.0

Overall, **di-wise-neo** has reached significant maturity by this point.  
After 33 releases over the past 6 months, the library now feels ready for a round
of final polishing before the `1.0.0` milestone.

`0.17.0` is the first (and possibly the only) release in a short series of `0.x`
releases dedicated to ensuring that no bugs are present and that all essential
features are in place for `1.0.0`.

### Changes

- ❗ Removed the `Middleware` API.  
  While it had its use cases, its design (carried over from **di-wise**) did not align
  with the direction of **di-wise-neo**. Equivalent functionality may return in the
  future through an extended `ContainerHook` support.
- ❗ Modified the `ContainerHook.onDispose` callback so that it is invoked after the
  container has been disposed, with a single array of all cached values, instead of
  being called individually for each value.
- Updated the `ContainerHook.onProvide` callback to also receive the scope of the
  provided token value.
- Added support for using a `@Type` decorator as shorthand for `@Inject(Type)`.  
  Since `@Inject` is both frequently used and relatively verbose, this change improves
  DevEx by reducing repetitive boilerplate code.

  Before:
  ```ts
  class Extension {
    constructor(@Inject(ILogOutputChannel) readonly log: vscode.LogOutputChannel) {}
    /* ... */
  }
  ```

  After:
  ```ts
  class Extension {
    constructor(@ILogOutputChannel readonly log: vscode.LogOutputChannel) {}
    /* ... */
  }
  ```
- Refactored internals to ensure better type correctness and long-term maintainability.

## 0.16.0

- Added support for container hooks, to be notified whenever the container provides
  a value for a `Token`, or whenever a container-managed value is disposed.
  See the `ContainerHook` interface for additional documentation.

  ```ts
  // Adding a hook
  container.addHook({
    onProvide: (value) => { /* ... */ },
    onDispose: (value) => { /* ... */ },
  });

  // Removing a hook
  container.removeHook(myHook);
  ```
- Exported the `assertInjectionContext` function, to allow consumers to assert that
  the current stack frame is within an injection context.

## 0.15.1

- Improved error reporting for unexpected `undefined` tokens passed to injection decorators.  
  The error message now references potential circular imports.

## 0.15.0

- Renamed the `forwardRef` utility function to `tokenRef`.
- Allowed passing a forward class reference to `ClassProvider`.  
  This is especially useful when creating a `ProviderType`, which might be used to hide
  the underlying implementation (we export the injectable type, not the class).

  ```ts
  const ISecretStore = createType<SecretStore>("SecretStore", {
    useClass: classRef(() => SecretStoreImpl), // SecretStoreImpl is defined later in the file 
  });
  ```

## 0.14.2

- Updated JSDocs to better clarify when injection decorators and injection functions may throw.
- Cleaned up internal code.

## 0.14.1

- Restored the correct type checking for `Type`.  
  This was accidentally broken in 0.13.0 with the removal of `Type.inter` and `Type.union`.

## 0.14.0

- Added support for passing a default `Provider`, and optionally default registration options,
  directly when creating a `Type` via `createType`.

  ```ts
  const ITaskManager = createType<TaskManager>("TaskManager", { useClass: CloudTaskManagerImpl });
  
  // No need to pass in a provider at registration site
  container.register(ITaskManager);
  ```

## 0.13.0

- Removed the `Type.inter` and `Type.union` utility functions.  
  They were untested, and revealed to be practically unnecessary in real-world usages.

## 0.12.1

- Fixed an issue where explicitly passing `undefined` in container or child container
  creation options could override default values, causing unexpected behavior.

## 0.12.0

- ❗ Split `Container.resolve` and `Container.resolveAll` into separate functions for
  **required** and **optional** resolution.

  This change simplifies the container API and reduces long-term maintenance effort.

  #### Before

  ```ts
  container.resolve(token, true /* optional */);
  container.resolveAll(token, true /* optional */);
  ```

  #### After

  ```ts
  container.tryResolve(token);
  container.tryResolveAll(token);
  ```

- Improved JSDoc comments for parts of the public API.

## 0.11.2

- Avoided filtering out `null` or `undefined` values from `Container.resolveAll`.  
  Token providers may legitimately return these values, so they should not be discarded by the library.
- Cleaned up a couple of JSDoc comments.

## 0.11.1

- Improved the type definition for `ExistingProvider`.
- Cleaned up a couple of JSDoc comments.
- Removed unnecessary internal code.

## 0.11.0

- Reworked the `useExisting` token aliasing mechanism to be more consistent.  
  The `ExistingProvider` interface now accepts a `name` option, like all other provider types,
  and can point to a named existing token.
- Improved various error messages to be more descriptive, and shorter in certain cases.  
  Each error now includes the complete error trace.

## 0.10.0

### Beta Status

The library is now in **Beta**.  
From this point on, the public API will no longer introduce breaking changes without prior deprecation.  
Breaking changes may still occur, but only:

- For critical technical reasons
- To deliver substantial improvements to developer experience

### Changes

- ❗ Removed the **Inherited** scope, making **Transient** the new default.

  If you still rely on **Inherited**, continue using `0.9.4` until you're ready to migrate.
  I believe there is no valid use case for **Inherited** that can't be solved with other scopes,
  so moving away from it should be straightforward.

## 0.9.4

- Expanded support for unnamed/anonymous classes in error reporting across the entire codebase.
- Improved the error message used when a token attempts to alias itself via `useExisting`.
- Improved the error message used when registering a token with a name that is already taken.

## 0.9.3

- Improved error messages for failed decorator-based parameter injection.

  ```text
  [di-wise-neo] failed to resolve dependency for Wizard(parameter #0: Type<Castle>)
    [cause] unregistered token Type<Castle>
  ```
- Handled unnamed/anonymous classes in error reporting to keep error messages understandable.
- Refactored dependency resolution internals to improve long-term maintainability.

## 0.9.2

- Improved the circular dependency error message to include the full resolution path.

  ```text
  [di-wise-neo] circular dependency detected while resolving Wizard → Wand → Wizard
  ```
- Performed various internal cleanups.

## 0.9.1

- Added an error when the `@Named` decorator is used with `@InjectAll` or `@OptionalAll`,
  since these decorators ignore the name qualifier.
- Improved the error message for multiple `@Named` decorators declared on a class or parameter.

  ```text
  [di-wise-neo] multiple @Named decorators on Wizard.set parameter 0, but only one is allowed
  ```
- Improved the error message for multiple injection decorators declared on a parameter.

  ```text
  [di-wise-neo] multiple injection decorators on Wizard.set parameter 0, but only one is allowed
  ```

## 0.9.0

- ❗ Prohibited implicit class registration during resolution.  
  Previously, the library allowed resolving classes that had never been registered,
  as long as they were not in **Container** scope. For example:

  ```ts
  @Scoped("Transient")
  class UnregisteredClass {
    /* ... */ 
  }

  container.resolve(UnregisteredClass);
  ```

  would successfully return an instance of `UnregisteredClass` as it is in **Transient** scope,
  even without prior explicit registration.

  This behavior had two major issues:
  - It was counterintuitive, as most users expect only registered classes to be resolvable.
  - It was dangerous, as classes assumed to be registered could be resolved implicitly by accident,
    leading to unintended successful injections.

  With this change, implicit registration is no longer allowed, and the only ways for a class
  to be auto-registered are by decorating it with `@AutoRegister()` or by creating the container
  with `autoRegister: true`.
- Improved the unregistered token error message to include the name qualifier, if present.

  ```text
  [di-wise-neo] unregistered class Wizard[name=Voldemort]
  ```

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
