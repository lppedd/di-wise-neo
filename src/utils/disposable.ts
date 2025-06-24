export interface Disposable {
  dispose(): void;
}

/**
 * Returns whether the inputted object implements the {@link Disposable} interface.
 */
export function isDisposable(value: any): value is Disposable {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  return value && typeof value === "object" && typeof value.dispose === "function";
}
