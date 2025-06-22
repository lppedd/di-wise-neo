import type { Constructor } from "../token";

/**
 * Decorator API for classes.
 *
 * @see {@link https://github.com/tc39/proposal-decorators?tab=readme-ov-file#classes}
 */
export type ClassDecorator<Class extends Constructor<object>> = (
  value: Class,
  context: ClassDecoratorContext<Class>,
) => Class | void;

/**
 * Decorator API for class fields.
 *
 * @see {@link https://github.com/tc39/proposal-decorators?tab=readme-ov-file#class-fields}
 */
export type ClassFieldDecorator<Value> = <This extends object>(
  value: undefined,
  context: ClassFieldDecoratorContext<This, Value>,
) => ((this: This, initialValue: Value) => Value) | void;
