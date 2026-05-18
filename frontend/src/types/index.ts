export type MarkerItem = {
  type?: string;
  id?: string | number;

  state?: string;
  city?: string;

  count?: number;

  latitude?: number;
  longitude?: number;

  geometry?: {
    type?: string;
    coordinates: [number, number];
  };

  properties?: {
    cluster?: boolean;
    cluster_id?: number;
    point_count?: number;
    point_count_abbreviated?: number;

    id?: string;
    brand_name?: string;
    city?: string;
    state?: string;
    status?: string;
    count?: number;
    type?: string;
  };

  brand_name?: string;
  status?: string;
};

export type DataResponse = {
  type: "STATE" | "CITY" | "SHOP";
  data: MarkerItem[];
};

export type ApiResponse = {
  source: string;
  data: DataResponse;
};
