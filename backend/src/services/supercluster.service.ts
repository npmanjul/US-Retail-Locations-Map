import Supercluster from "supercluster";
import type { MapFeature } from "../types/store.ts";

const supercluster = new Supercluster({
  radius: 200,
  maxZoom: 13,
  minPoints: 2,
  nodeSize: 64,
});

export const generateClusters = (
  items: any[],
  west: number,
  south: number,
  east: number,
  north: number,
  zoom: number,
) => {
  const points: MapFeature[] = items.map((item) => ({
    type: "Feature",

    properties: {
      id: item.id,
      brand_name: item.brand_name,
      city: item.city,
      state: item.state,
      status: item.status,
      count: item.count,
      cluster: item.cluster,
      point_count: item.point_count,
    },

    geometry: {
      type: "Point",

      coordinates: [Number(item.longitude), Number(item.latitude)],
    },
  }));

  supercluster.load(points);

  return supercluster.getClusters([west, south, east, north], Math.floor(zoom));
};
