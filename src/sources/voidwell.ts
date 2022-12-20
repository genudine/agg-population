import { ServiceResponse } from "../types";

interface VoidwellResponse {
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
}

const platform = (worldID: string) => {
  switch (worldID) {
    case "1000":
      return "ps4us";
    case "2000":
      return "ps4eu";
    default:
      return "pc";
  }
};

// Voidwell is missing Oshur, and since zoneStates are the only way we can get a faction-specific population count,
// we're stuck with not counting faction populations.
export const voidwellFetchWorld = async (
  worldID: string
): Promise<ServiceResponse<undefined, VoidwellResponse>> => {
  const res = await fetch(
    `https://api.voidwell.com/ps2/worldstate/${worldID}?platform=${platform(
      worldID
    )}`
  );
  const data: VoidwellResponse = await res.json();

  return {
    raw: data,
    population: {
      total: data.onlineCharacters,
      nc: undefined,
      tr: undefined,
      vs: undefined,
    },
    cachedAt: new Date(),
  };
};
