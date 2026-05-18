export type Store = {
  id: string;
  brand_name: string;
  latitude: number;
  longitude: number;
  state: string;
  city: string;
  status: string;
};

export type ClusterProperties = {
  id: number;
  brand_name: string;
  city: string;
  state: string;
  status: string;
};

export type MapFeature = GeoJSON.Feature<
  GeoJSON.Point,
  {
    id: string;
    brand_name?: string;
    city?: string;
    state?: string;
    status?: string;
    count?: number;

    cluster?: boolean;
    point_count?: number;
  }
>;
