import { Cache } from "../cache";
import { ServiceResponse } from "../types";

type HonuResponse = {
  worldID: number;
  timestamp: string;
  cachedUntil: string;
  total: number;
  nc: number;
  tr: number;
  vs: number;
  ns_vs: number;
  ns_tr: number;
  ns_nc: number;
  nsOther: number;
}[];

const honuFetchAllWorlds = async (cache: Cache): Promise<HonuResponse> => {
  const cached = await cache.get<HonuResponse>("honu");
  if (cached) {
    return cached;
  }

  const req = await fetch(
    `https://wt.honu.pw/api/population/multiple?worldID=1&worldID=10&worldID=13&worldID=17&worldID=19&worldID=40&worldID=1000&worldID=2000`
  );

  return await cache.put("honu", await req.json<HonuResponse>());
};

export const honuFetchWorld = async (
  worldID: string,
  cache: Cache
): Promise<ServiceResponse<number, any>> => {
  const start = Date.now();
  const resp = await honuFetchAllWorlds(cache);
  const end = Date.now();

  const data = resp.find((w) => w.worldID === Number(worldID));

  if (!data) {
    throw new Error(`honu: World ${worldID} not found`);
  }

  return {
    population: {
      total: data.total,
      nc: data.nc + data.ns_nc,
      tr: data.tr + data.ns_tr,
      vs: data.vs + data.ns_vs,
    },
    raw: data,
    cachedAt: new Date(),
    timings: {
      enter: start,
      exit: end,
      upstream: end - start,
    },
  };
};
