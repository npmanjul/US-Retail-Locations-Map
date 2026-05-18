import { pool } from "../db/index.ts";
import { generateClusters } from "./supercluster.service.ts";

export const getMapData = async (
  north: number,
  south: number,
  east: number,
  west: number,
  zoom: number,
) => {
  const z = Math.floor(zoom);

  // TIER 1 -> STATE LEVEL

  if (z <= 7) {
    const result = await pool.query(
      `
      SELECT
        state,

        COUNT(*)::int as count,

        AVG(ST_Y(location::geometry)) as latitude,
        AVG(ST_X(location::geometry)) as longitude

      FROM stores

      GROUP BY state
      `,
    );

    return {
      type: "STATE",
      total: result.rows.length,
      data: result.rows,
    };
  }

  // TIER 2 -> CITY LEVEL WITH CLUSTERING

  if (z > 7 && z < 12) {
    const result = await pool.query(
      `
      SELECT
        city,
        state,

        COUNT(*)::int as count,

        AVG(ST_Y(location::geometry)) as latitude,
        AVG(ST_X(location::geometry)) as longitude

      FROM stores

      WHERE
        location && ST_MakeEnvelope($1,$2,$3,$4,4326)

      GROUP BY city, state
      `,
      [west, south, east, north],
    );

    const cityClusters = generateClusters(
      result.rows.map((city) => ({
        id: `${city.city}-${city.state}`,
        brand_name: city.city,
        city: city.city,
        state: city.state,
        status: city.status,
        latitude: city.latitude,
        longitude: city.longitude,
        count: city.count,
      })),
      west,
      south,
      east,
      north,
      z,
    );

    return {
      type: "CITY",
      total: cityClusters.length,
      data: cityClusters,
    };
  }

  // TIER 3 -> SHOP LEVEL

  const result = await pool.query(
    `
    SELECT
      store_id,
      brand_name,
      city,
      state,
      status,

      ST_X(location::geometry) AS longitude,
      ST_Y(location::geometry) AS latitude

    FROM stores

    WHERE
      location && ST_MakeEnvelope($1,$2,$3,$4,4326)

    LIMIT 1000
    `,
    [west, south, east, north],
  );

  const shopClusters = generateClusters(
    result.rows.map((shop) => ({
      id: `${shop.store_id}`,
      brand_name: shop.brand_name,
      city: shop.city,
      state: shop.state,
      status: shop.status,
      latitude: shop.latitude,
      longitude: shop.longitude,
      count: shop.count,
    })),
    west,
    south,
    east,
    north,
    z,
  );

  return {
    type: "SHOP",
    total: shopClusters.length,
    data: shopClusters,
  };
};
