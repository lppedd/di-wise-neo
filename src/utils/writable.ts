// SPDX-License-Identifier: MIT

// @internal
export type Writable<T> = {
  -readonly [P in keyof T]: T[P];
};
