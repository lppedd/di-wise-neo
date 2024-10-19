import {invariant} from "./invariant";

// @internal
export class KeyedStack<K, V> {
  private entries = new Array<{key: K; value: V}>();

  private keys = new Set<K>();

  has(key: K) {
    return this.keys.has(key);
  }

  peek() {
    const entry = this.entries.at(-1);
    return entry?.value;
  }

  pop() {
    const entry = this.entries.pop();
    if (entry) {
      this.keys.delete(entry.key);
      return entry.value;
    }
  }

  push(key: K, value: V) {
    invariant(!this.keys.has(key));
    this.keys.add(key);
    this.entries.push({key, value});
  }
}
