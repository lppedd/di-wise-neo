import {invariant} from "./invariant";

// @internal
export class KeyedStack<K extends object, V> {
  private entries = new Array<{key: K; value: V}>();

  private keys = new WeakSet<K>();

  has(key: K) {
    return this.keys.has(key);
  }

  peek() {
    const entry = this.entries.at(-1);
    return entry?.value;
  }

  push(key: K, value: V) {
    invariant(!this.has(key));
    this.keys.add(key);
    this.entries.push({key, value});
    return () => {
      this.entries.pop();
      this.keys.delete(key);
    };
  }
}
