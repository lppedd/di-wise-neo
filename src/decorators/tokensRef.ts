import type { Token, Tokens } from "../token";

export interface TokensRef<Value = any> {
  readonly getRefTokens: () => Set<Token<Value>>;
}

/**
 * Allows referencing tokens that are declared after this usage.
 */
export function ref<Value>(tokens: () => Token<Value> | Tokens<Value>): TokensRef<Value> {
  return {
    getRefTokens: () => {
      // Normalize the single token here, so that we don't have
      // to do it at every getRefTokens call site
      const tokenOrTokens = tokens();
      const tokensArray = Array.isArray(tokenOrTokens) ? tokenOrTokens : [tokenOrTokens];
      return new Set(tokensArray);
    },
  };
}

// @internal
export function isTokensRef(value: any): value is TokensRef {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  return !!value && typeof value.getRefTokens === "function";
}
