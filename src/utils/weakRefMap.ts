import { check } from "../errors";

// @internal
export class WeakRefMap<K extends WeakKey, V extends object> {
  private readonly myMap = new WeakMap<K, WeakRef<V>>();

  get(key: K): V | undefined {
    const ref = this.myMap.get(key);

    if (ref) {
      const value = ref.deref();

      if (value) {
        return value;
      }

      this.myMap.delete(key);
    }

    return undefined;
  }

  set(key: K, value: V): () => void {
    check(!this.get(key), "internal: invariant violation");
    this.myMap.set(key, new WeakRef(value));
    return () => {
      this.myMap.delete(key);
    };
  }
}
