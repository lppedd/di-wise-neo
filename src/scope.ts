export const InjectionScope = {
  Inherited: "Inherited",
  Transient: "Transient",
  Resolution: "Resolution",
  Container: "Container",
} as const;

export type InjectionScope = typeof InjectionScope[keyof typeof InjectionScope];
