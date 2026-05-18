import { pool } from "../db/index.ts";
import type { Store } from "../types/store.ts";
import { loadCsv } from "../utils/loadCsv.ts";

export const seedDatabase = async () => {
  try {
    console.log("⚙️ Creating PostGIS extension...");

    await pool.query(`
      CREATE EXTENSION IF NOT EXISTS postgis;
    `);

    console.log("⚙️ Creating stores table...");

    await pool.query(`
      CREATE TABLE IF NOT EXISTS stores (
        id BIGSERIAL PRIMARY KEY,
        store_id TEXT UNIQUE,
        brand_name TEXT,
        state TEXT,
        city TEXT,
        status TEXT,
        location GEOMETRY(Point, 4326)
      );
    `);

    console.log("⚙️ Creating indexes...");

    await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_store_location
        ON stores
        USING GIST(location);

        CREATE INDEX IF NOT EXISTS idx_store_state
        ON stores(state);

        CREATE INDEX IF NOT EXISTS idx_store_city
        ON stores(city);

        CREATE INDEX IF NOT EXISTS idx_store_state_city
        ON stores(state, city);
    `);

    const existingData = await pool.query(`
      SELECT COUNT(*) FROM stores;
    `);

    const totalRows = Number(existingData.rows[0].count);

    if (totalRows > 0) {
      console.log(`✅ Database already seeded with ${totalRows} stores`);
      return;
    }

    console.log("📁 Loading CSV...");
    const stores = (await loadCsv()) as Store[];

    console.log("🚀 Bulk inserting stores...");

    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const batchSize = 5000;

      for (let i = 0; i < stores.length; i += batchSize) {
        const batch = stores.slice(i, i + batchSize);

        const values: any[] = [];
        const placeholders: string[] = [];

        batch.forEach((store: Store, index: number) => {
          const offset = index * 7;

          placeholders.push(`
            (
              $${offset + 1},
              $${offset + 2},
              $${offset + 3},
              $${offset + 4},
              $${offset + 5},
              ST_SetSRID(
                ST_MakePoint(
                  $${offset + 6},
                  $${offset + 7}
                ),
                4326
              )
            )
          `);

          values.push(
            store.id,
            store.brand_name,
            store.state,
            store.city,
            store.status,
            Number(store.longitude),
            Number(store.latitude),
          );
        });

        await client.query(
          `
          INSERT INTO stores (
            store_id,
            brand_name,
            state,
            city,
            status,
            location
          )
          VALUES ${placeholders.join(",")}
          ON CONFLICT (store_id)
          DO NOTHING
          `,
          values,
        );

        console.log(`✅ Inserted batch: ${i + batch.length}/${stores.length}`);
      }

      await client.query("COMMIT");

      console.log("🎉 Database seeded successfully");
    } catch (error) {
      await client.query("ROLLBACK");

      console.error("❌ Transaction failed:", error);

      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("❌ Database seed error:", error);
  }
};
