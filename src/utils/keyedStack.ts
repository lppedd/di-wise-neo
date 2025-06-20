import { invariant } from "./invariant";

// @internal
export class KeyedStack<K extends object, V> {
  private readonly entries = new Array<{ key: K; value: V }>();
  private readonly keys = new WeakSet<K>();

  has(key: K): boolean {
    return this.keys.has(key);
  }

  peek(): V | undefined {
    const entry = this.entries.at(-1);
    return entry?.value;
  }

  push(key: K, value: V): () => void {
    invariant(!this.has(key));
    this.keys.add(key);
    this.entries.push({ key, value });
    return () => {
      this.entries.pop();
      this.keys.delete(key);
    };
  }
}
