import NodeCache from "node-cache";

const viewportCache = new NodeCache({
  stdTTL: 600, // Cache for 10 minutes
  checkperiod: 60,
});

export const setViewportCache = (key: string, value: any) => {
  viewportCache.set(key, value);
};

export const getViewportCache = (key: string) => {
  return viewportCache.get(key);
};
