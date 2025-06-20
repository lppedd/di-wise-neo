import { invariant } from "./invariant";

// @internal
export class WeakRefMap<K extends WeakKey, V extends object> {
  private readonly map = new WeakMap<K, WeakRef<V>>();

  get(key: K): V | undefined {
    const ref = this.map.get(key);

    if (ref) {
      const value = ref.deref();

      if (value) {
        return value;
      }

      this.map.delete(key);
    }
  }

  set(key: K, value: V): () => void {
    invariant(!this.get(key));
    this.map.set(key, new WeakRef(value));
    return () => {
      this.map.delete(key);
    };
  }
}
