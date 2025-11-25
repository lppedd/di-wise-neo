import type { Constructor } from "../token";

//
// Replicates built-in TypeScript experimental decorators, but with better type correctness.
//

export type ClassDecorator<Class extends object> = (target: Constructor<Class>) => Constructor<Class> | void;
export type ParameterDecorator = (target: object, propertyKey: string | symbol | undefined, parameterIndex: number) => void;
