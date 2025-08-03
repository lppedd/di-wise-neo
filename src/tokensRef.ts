// SPDX-License-Identifier: MIT

import { assert } from "./errors";
import type { Token, Tokens } from "./token";

export interface TokensRef<Value = any> {
  readonly getRefTokens: () => Set<Token<Value>>;
}

export interface TokenRef<Value = any> {
  readonly getRefToken: () => Token<Value>;
}

/**
 * Allows referencing tokens that are declared later in the file by wrapping them
 * in a lazily evaluated function.
 */
export function forwardRef<Value>(token: () => Tokens<Value>): TokensRef<Value>;

/**
 * Allows referencing a token that is declared later in the file by wrapping it
 * in a lazily evaluated function.
 */
export function forwardRef<Value>(token: () => Token<Value>): TokenRef<Value>;

export function forwardRef<Value>(token: () => Token<Value> | Tokens<Value>): TokensRef<Value> & TokenRef<Value> {
  return {
    getRefTokens: (): Set<Token<Value>> => {
      // Normalize the single token here, so that we don't have
      // to do it at every getRefTokens call site
      const tokenOrTokens = token();
      const tokensArray = Array.isArray(tokenOrTokens) ? tokenOrTokens : [tokenOrTokens];
      return new Set(tokensArray);
    },
    getRefToken: () => {
      const tokenOrTokens = token();
      assert(!Array.isArray(tokenOrTokens), "internal error: ref tokens should be a single token");
      return tokenOrTokens;
    },
  };
}

// @internal
export function isTokensRef(value: any): value is TokensRef {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  return value && typeof value === "object" && typeof value.getRefTokens === "function";
}

// @internal
export function isTokenRef(value: any): value is TokenRef {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  return value && typeof value === "object" && typeof value.getRefToken === "function";
}
