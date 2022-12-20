import { Cache } from "../cache";
import { ServiceResponse } from "../types";

type VoidwellResponse = Array<{
  id: number;
  name: string;
  isOnline: boolean;
  onlineCharacters: number;
  zoneStates: {
    id: number;
    name: string;
    isTracking: boolean;
    lockState: {
      state: string;
      timestamp: string;
      metagameEventId: number;
      triggeringFaction: number;
    };
    population: {
      vs: number;
      nc: number;
      tr: number;
      ns: number;
    }[];
  };
}>;

const voidwellFetchAllWorlds = async (
  cache: Cache
): Promise<VoidwellResponse> => {
  const cached = await cache.get<VoidwellResponse>("voidwell");
  if (cached) {
    return cached;
  }

  const [pc, ps4us, ps4eu] = await Promise.all([
    fetch(`https://api.voidwell.com/ps2/worldstate/?platform=pc`)
      .then((res) => res.json<VoidwellResponse>())
      .catch((e) => {
        console.error("voidwell PC ERROR", e);
        return [] as VoidwellResponse;
      }),
    fetch(`https://api.voidwell.com/ps2/worldstate/?platform=ps4us`)
      .then((res) => res.json<VoidwellResponse>())
      .catch((e) => {
        console.error("voidwell PS4US ERROR", e);
        return [] as VoidwellResponse;
      }),
    fetch(`https://api.voidwell.com/ps2/worldstate/?platform=ps4eu`)
      .then((res) => res.json<VoidwellResponse>())
      .catch((e) => {
        console.error("voidwell PS4EU ERROR", e);
        return [] as VoidwellResponse;
      }),
  ]);

  // console.log("voidwell data fetched", JSON.stringify({ pc, ps4us, ps4eu }));
  const response: VoidwellResponse = [
    ...pc,
    ...ps4us,
    ...ps4eu,
  ] as VoidwellResponse;

  return await cache.put("voidwell", response);
};

// Voidwell is missing Oshur, and since zoneStates are the only way we can get a faction-specific population count,
// we're stuck with not counting faction populations.
export const voidwellFetchWorld = async (
  worldID: string,
  cache: Cache
): Promise<ServiceResponse<undefined, VoidwellResponse[0]>> => {
  const start = Date.now();
  const data = await voidwellFetchAllWorlds(cache);
  const end = Date.now();

  const world = data.find((w) => w.id === Number(worldID));

  if (!world) {
    throw new Error(`voidwell: World ${worldID} not found`);
  }

  return {
    raw: world,
    population: {
      total: world.onlineCharacters,
      nc: undefined,
      tr: undefined,
      vs: undefined,
    },
    cachedAt: new Date(),
    timings: {
      enter: start,
      exit: end,
      upstream: end - start,
    },
  };
};
