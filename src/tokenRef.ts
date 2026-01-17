import { check } from "./errors";
import type { Constructor, Token, Tokens } from "./token";

export interface ClassRef<Instance extends object> {
  readonly getRefClass: () => Constructor<Instance>;
}

export interface TokenRef<Value> {
  readonly getRefToken: () => Token<Value>;

  /**
   * @internal
   */
  readonly getRefTokens: () => Set<Token<Value>>;
}

/**
 * Allows referencing a class declared later in the file by wrapping it
 * into a lazily evaluated function.
 */
// @__NO_SIDE_EFFECTS__
export function classRef<Instance extends object>(Class: () => Constructor<Instance>): ClassRef<Instance> {
  return {
    getRefClass: () => Class(),
  };
}

/**
 * Allows referencing a token declared later in the file by wrapping it
 * into a lazily evaluated function.
 */
export function tokenRef<Value>(token: () => Token<Value>): TokenRef<Value>;

// @internal
export function tokenRef<Value>(token: () => Tokens<Value>): TokenRef<Value>;

// @__NO_SIDE_EFFECTS__
export function tokenRef<Value>(token: () => Token<Value> | Tokens<Value>): TokenRef<Value> {
  return {
    getRefToken: () => {
      const tokenOrTokens = token();
      check(!Array.isArray(tokenOrTokens), "internal: unexpected array of tokens");
      return tokenOrTokens;
    },
    getRefTokens: () => {
      // Normalize the single token here so that we don't have to do it at every getRefTokens call site
      const tokenOrTokens = token();
      const tokensArray = Array.isArray(tokenOrTokens) ? tokenOrTokens : [tokenOrTokens];
      return new Set(tokensArray);
    },
  };
}

// @internal
export function isClassRef<T extends object>(value: any): value is ClassRef<T> {
  return value != null && typeof value === "object" && typeof value.getRefClass === "function";
}

// @internal
export function isTokenRef<T>(value: any): value is TokenRef<T> {
  return value != null && typeof value === "object" && typeof value.getRefToken === "function";
}
