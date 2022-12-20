import { Cache } from "../cache";
import { ServiceResponse } from "../types";

interface FisuResponse {
  result: Record<
    string,
    {
      worldId: number;
      vs: number;
      nc: number;
      tr: number;
      ns: number;
    }[]
  >;
}

const fisuFetchAllWorlds = async (cache: Cache): Promise<FisuResponse> => {
  const cached = await cache.get<FisuResponse>("fisu");
  if (cached) {
    // console.log("FISU data cached", cached);
    return cached;
  }

  const [pc, ps4us, ps4eu] = await Promise.all([
    fetch(`https://ps2.fisu.pw/api/population/?world=1,10,13,17,19,40`)
      .then((res) => res.json<FisuResponse>())
      .catch((e) => {
        console.error("FISU PC ERROR", e);
        return { result: {} } as FisuResponse;
      }),
    fetch(`https://ps4us.ps2.fisu.pw/api/population/?world=1000`)
      .then((res) => res.json<FisuResponse>())
      .catch((e) => {
        console.error("FISU PS4US ERROR", e);
        return { result: {} } as FisuResponse;
      }),
    fetch(`https://ps4eu.ps2.fisu.pw/api/population/?world=2000`)
      .then((res) => res.json<FisuResponse>())
      .catch((e) => {
        console.error("FISU PS4EU ERROR", e);
        return { result: {} } as FisuResponse;
      }),
  ]).catch((e) => {
    console.error("FISU ERROR", e);
    return [{ result: {} }, { result: {} }, { result: {} }] as FisuResponse[];
  });

  // console.log("FISU data fetched", JSON.stringify({ pc, ps4us, ps4eu }));
  const response: FisuResponse = {
    result: {
      ...pc.result,
      "1000": [ps4us.result[0] as any],
      "2000": [ps4eu.result[0] as any],
    },
  };

  return await cache.put("fisu", response);
};

export const fisuFetchWorld = async (
  worldID: string,
  cache: Cache
): Promise<ServiceResponse<number, any>> => {
  const start = Date.now();
  const data: FisuResponse = await fisuFetchAllWorlds(cache);
  const end = Date.now();

  const world = data.result[worldID];
  if (!world) {
    console.error(`fisu: World ${worldID} not found`);
    throw new Error(`fisu: World ${worldID} not found`);
  }

  const { nc, tr, vs, ns } = world[0];

  return {
    raw: world[0],
    population: {
      total: vs + nc + tr + ns,
      nc,
      tr,
      vs,
    },
    cachedAt: new Date(),
    timings: {
      enter: start,
      exit: end,
      upstream: end - start,
    },
  };
};
