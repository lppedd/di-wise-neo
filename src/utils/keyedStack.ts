// SPDX-License-Identifier: MIT

import { invariant } from "./invariant";

// @internal
export class KeyedStack<K extends object, V> {
  private readonly myEntries = new Array<{ key: K; value: V }>();
  private readonly myKeys = new WeakSet<K>();

  has(key: K): boolean {
    return this.myKeys.has(key);
  }

  peek(): V | undefined {
    const entry = this.myEntries.at(-1);
    return entry?.value;
  }

  push(key: K, value: V): () => void {
    invariant(!this.has(key));
    this.myKeys.add(key);
    this.myEntries.push({ key, value });
    return () => {
      this.myEntries.pop();
      this.myKeys.delete(key);
    };
  }
}
