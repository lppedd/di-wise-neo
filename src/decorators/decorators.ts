import type { Constructor } from "../token";

//
// Replicates built-in TypeScript experimental decorators but with better type correctness.
//

export type ClassDecorator<Class extends object> = <T extends Constructor<Class>>(target: T) => T | void;
export type ParameterDecorator = (target: object, propertyKey: string | symbol | undefined, parameterIndex: number) => void;
