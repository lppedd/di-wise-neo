export interface Disposable {
  dispose(): void;
}

/**
 * Returns whether the inputted object implements the {@link Disposable} interface.
 */
export function isDisposable(obj: any): obj is Disposable {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  return !!obj && typeof obj === "object" && typeof obj.dispose === "function";
}
