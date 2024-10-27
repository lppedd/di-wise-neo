// @internal
export class KeyedStack<K extends object, V> {
  private entries = new Array<{key: K; value: V}>();

  private keys = new WeakSet<K>();

  has(key: K) {
    return this.keys.has(key);
  }

  peek(n = 0) {
    const entry = this.entries.at(-(n + 1));
    return entry?.value;
  }

  /**
   * @invariant `!this.has(key)`
   */
  push(key: K, value: V) {
    this.keys.add(key);
    this.entries.push({key, value});
    return () => {
      this.entries.pop();
      this.keys.delete(key);
    };
  }
}
