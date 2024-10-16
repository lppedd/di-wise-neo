import type {Container} from "./container";
import type {InjectionProvider} from "./provider";
import type {InjectionScope} from "./scope";
import {createContext} from "./utils/context";
import type {Stack} from "./utils/stack";

export interface InjectionContext {
  container: Container;
  resolution: Resolution;
}

export interface Resolution {
  stack: Stack<InjectionProvider, ResolutionFrame>;
  instances: Map<InjectionProvider, any>;
  dependents: Map<InjectionProvider, any>;
}

export interface ResolutionFrame {
  scope: ResolvedScope;
  provider: InjectionProvider;
}

export type ResolvedScope = Exclude<
  InjectionScope,
  typeof InjectionScope.Inherited
>;

// @internal
export const [withInjectionContext, useInjectionContext] = createContext<InjectionContext>();
