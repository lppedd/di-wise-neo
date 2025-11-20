// @internal
export interface Disposable {
  dispose(): void;
}

// @internal
export function isDisposable(value: any): value is Disposable {
  return value != null && typeof value === "object" && typeof value.dispose === "function";
}
