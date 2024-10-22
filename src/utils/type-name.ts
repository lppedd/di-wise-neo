// @internal
export function getTypeName(value: unknown) {
  if (typeof value == "string") {
    return `"${value}"`;
  }
  if (typeof value == "function") {
    return (value.name && `typeof ${value.name}`) || "Function";
  }
  if (typeof value == "object") {
    if (value === null) {
      return "null";
    }
    const proto: object = Object.getPrototypeOf(value);
    if (proto === null) {
      return "Object";
    }
    const constructor: unknown = proto.constructor;
    if (typeof constructor == "function" && constructor.name) {
      return constructor.name;
    }
    return "(anonymous)";
  }
  return typeof value;
}
