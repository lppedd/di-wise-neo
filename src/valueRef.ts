// SPDX-License-Identifier: MIT

export interface ValueRef<T = any> {
  readonly current: T;
}
