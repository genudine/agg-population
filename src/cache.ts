import { DebugPayload, OnePayload } from "./types";

type WorldObject = {
  world: OnePayload | null;
  debug: DebugPayload;
};

export class WorldCache {
  constructor(public kv: KVNamespace, public disableCache: boolean = false) {}

  async get(id: string): Promise<WorldObject | null> {
    if (this.disableCache) {
      return null;
    }
    const world = await this.kv.get<WorldObject>(id, "json");
    return world;
  }

  async put(id: string, world: WorldObject): Promise<WorldObject> {
    if (this.disableCache) {
      return world;
    }

    await this.kv.put(id, JSON.stringify(world), {
      expirationTtl: 60 * 3,
    });

    return world;
  }
}
