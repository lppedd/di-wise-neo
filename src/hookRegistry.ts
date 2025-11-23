import type { ContainerHook } from "./container";

// @internal
export class HookRegistry {
  private readonly myHooks: Set<ContainerHook>;

  constructor(parent?: HookRegistry) {
    this.myHooks = new Set(parent?.myHooks);
  }

  clear(): void {
    this.myHooks.clear();
  }

  get(): Set<ContainerHook> {
    return this.myHooks;
  }

  add(hook: ContainerHook): void {
    this.myHooks.add(hook);
  }

  delete(hook: ContainerHook): void {
    this.myHooks.delete(hook);
  }
}
