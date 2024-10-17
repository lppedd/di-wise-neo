// @internal
export class KeyedStack<K, V> {
  private entries = new Array<{key: K; value: V}>();
  private keys = new Set<K>();

  push(key: K, value: V) {
    this.entries.push({key, value});
    this.keys.add(key);
  }

  pop() {
    const entry = this.entries.pop();
    if (entry) {
      this.keys.delete(entry.key);
      return entry.value;
    }
  }

  peek() {
    const entry = this.entries.at(-1);
    return entry?.value;
  }

  has(key: K) {
    return this.keys.has(key);
  }
}
