import type {Container} from "./container";
import type {Provider} from "./provider";
import type {Scope} from "./scope";
import {createContext} from "./utils/context";
import type {KeyedStack} from "./utils/keyed-stack";

export interface InjectionContext {
  container: Container;
  resolution: Resolution;
}

export interface Resolution {
  stack: KeyedStack<Provider, Frame>;
  instances: Map<Provider, any>;
  dependents: Map<Provider, any>;
}

export interface Frame {
  scope: ResolvedScope;
  provider: Provider;
}

export type ResolvedScope = Exclude<Scope, typeof Scope.Inherited>;

// @internal
export const [withInjectionContext, useInjectionContext] = createContext<InjectionContext>();
