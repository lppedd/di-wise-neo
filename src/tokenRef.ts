import { check } from "./errors";
import type { Constructor, Token, Tokens } from "./token";

export interface ClassRef<Instance extends object> {
  readonly getRefClass: () => Constructor<Instance>;
}

export interface TokensRef<Value = any> {
  readonly getRefTokens: () => Set<Token<Value>>;
}

export interface TokenRef<Value = any> {
  readonly getRefToken: () => Token<Value>;
}

/**
 * Allows referencing a class declared later in the file by wrapping it
 * in a lazily evaluated function.
 *
 * @__NO_SIDE_EFFECTS__
 */
export function classRef<Instance extends object>(Class: () => Constructor<Instance>): ClassRef<Instance> {
  return {
    getRefClass: () => Class(),
  };
}

/**
 * Allows referencing tokens declared later in the file by wrapping them
 * in a lazily evaluated function.
 */
export function tokenRef<Value>(token: () => Tokens<Value>): TokensRef<Value>;

/**
 * Allows referencing a token declared later in the file by wrapping it
 * in a lazily evaluated function.
 */
export function tokenRef<Value>(token: () => Token<Value>): TokenRef<Value>;

// @__NO_SIDE_EFFECTS__
export function tokenRef<Value>(token: () => Tokens<Value> | Token<Value>): TokensRef<Value> & TokenRef<Value> {
  return {
    getRefTokens: () => {
      // Normalize the single token here so that we don't have to do it at every getRefTokens call site
      const tokenOrTokens = token();
      const tokensArray = Array.isArray(tokenOrTokens) ? tokenOrTokens : [tokenOrTokens];
      return new Set(tokensArray);
    },
    getRefToken: () => {
      const tokenOrTokens = token();
      check(!Array.isArray(tokenOrTokens), "internal error: ref tokens should be a single token");
      return tokenOrTokens;
    },
  };
}

// @internal
export function isClassRef<T extends object>(value: any): value is ClassRef<T> {
  return value && typeof value === "object" && typeof value.getRefClass === "function";
}

// @internal
export function isTokensRef<T>(value: any): value is TokensRef<T> {
  return value && typeof value === "object" && typeof value.getRefTokens === "function";
}

// @internal
export function isTokenRef<T>(value: any): value is TokenRef<T> {
  return value && typeof value === "object" && typeof value.getRefToken === "function";
}
