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
  DISABLE_KIWI: "1" | undefined;
  DISABLE_CACHE: "1" | undefined;
  VOIDWELL_USE_PS4: "1" | undefined;
  FISU_USE_PS4EU: "1" | undefined;
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
    kiwi: number | null;
  };
};

export type DebugPayload = {
  raw: {
    saerro: any;
    fisu: any;
    honu: any;
    voidwell: any;
    kiwi: any;
  };
  timings: {
    saerro: any;
    fisu: any;
    honu: any;
    voidwell: any;
    kiwi: any;
  };
  lastFetchTimes: {
    saerro?: Date;
    fisu?: Date;
    honu?: Date;
    voidwell?: Date;
    kiwi?: Date;
  };
};

export type Flags = {
  disableHonu: boolean;
  disableFisu: boolean;
  disableSaerro: boolean;
  disableVoidwell: boolean;
  disableKiwi: boolean;
  voidwellUsePS4: boolean;
  fisuUsePS4EU: boolean;
};
