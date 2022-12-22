export class Cache {
  private cache: Map<string, any> = new Map();
  constructor(public kv: KVNamespace, public disableCache: boolean = false) {}

  async get<T>(id: string): Promise<T | null> {
    if (this.disableCache) {
      return null;
    }

    // console.log("cache get", id);
    let item = this.cache.get(id);
    if (!item) {
      // console.log("remote cache get", id);
      item = await this.kv.get<T>(id, "json");
      if (item) {
        // console.log("local cache miss, remote cache hit", id);
        this.cache.set(id, item);
      }
    }
    return item;
  }

  async put<T>(id: string, world: T, ttl: number = 60 * 3): Promise<T> {
    if (this.disableCache) {
      return world;
    }

    this.cache.set(id, world);

    await this.kv.put(id, JSON.stringify(world), {
      expirationTtl: ttl,
    });

    return world;
  }
}
