// SPDX-License-Identifier: MIT

// @internal
export interface Disposable {
  dispose(): void;
}

// @internal
export function isDisposable(value: any): value is Disposable {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  return value && typeof value === "object" && typeof value.dispose === "function";
}
