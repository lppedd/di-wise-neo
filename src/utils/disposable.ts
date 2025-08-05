// @internal
export interface Disposable {
  dispose(): void;
}

// @internal
export function isDisposable(value: any): value is Disposable {
  return value && typeof value === "object" && typeof value.dispose === "function";
}
