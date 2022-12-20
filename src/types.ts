export interface Population<T extends number | undefined> {
  total: number;
  nc: T;
  tr: T;
  vs: T;
}

export interface ServiceResponse<PT extends number | undefined, Raw> {
  population: Population<PT>;
  raw: Raw;
  cachedAt: Date;
  timings?: {
    enter: number;
    upstream: number;
    exit: number;
  };
}

export interface Env {
  CACHE: KVNamespace;
  DISABLE_HONU: "1" | undefined;
  DISABLE_FISU: "1" | undefined;
  DISABLE_SAERRO: "1" | undefined;
  DISABLE_VOIDWELL: "1" | undefined;
  DISABLE_CACHE: "1" | undefined;
}

export type OnePayload = {
  id: number;
  average: number;
  factions: {
    nc: number;
    tr: number;
    vs: number;
  };
  services: {
    saerro: number | null;
    fisu: number | null;
    honu: number | null;
    voidwell: number | null;
  };
};

export type DebugPayload = {
  raw: {
    saerro: any;
    fisu: any;
    honu: any;
    voidwell: any;
  };
  timings: {
    saerro: any;
    fisu: any;
    honu: any;
    voidwell: any;
  };
  lastFetchTimes: {
    saerro?: Date;
    fisu?: Date;
    honu?: Date;
    voidwell?: Date;
  };
};

export type Flags = {
  disableHonu: boolean;
  disableFisu: boolean;
  disableSaerro: boolean;
  disableVoidwell: boolean;
};
