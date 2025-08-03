// SPDX-License-Identifier: MIT

// @internal
export function getTypeName(value: unknown): string {
  switch (typeof value) {
    case "string":
      return `"${value}"`;
    case "function":
      return (value.name && `typeof ${value.name}`) || "Function";
    case "object": {
      if (value === null) {
        return "null";
      }

      const proto: object | null = Object.getPrototypeOf(value);

      if (proto && proto !== Object.prototype) {
        const constructor: unknown = proto.constructor;

        if (typeof constructor === "function" && constructor.name) {
          return constructor.name;
        }
      }
    }
  }

  return typeof value;
}
