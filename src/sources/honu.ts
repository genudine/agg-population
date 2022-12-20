import { ServiceResponse } from "../types";

interface HonuResponse {
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
}

export const honuFetchWorld = async (
  worldID: string
): Promise<ServiceResponse<number, any>> => {
  const res = await fetch(`https://wt.honu.pw/api/population/${worldID}`);
  const data: HonuResponse = await res.json();

  return {
    population: {
      total: data.total,
      nc: data.nc + data.ns_nc,
      tr: data.tr + data.ns_tr,
      vs: data.vs + data.ns_vs,
    },
    raw: data,
    cachedAt: new Date(),
  };
};
