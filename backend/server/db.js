const { Pool } = require("pg");
const { config } = require("./config");

if (!config.databaseUrl) {
  throw new Error("Missing PostgreSQL configuration. Set DATABASE_URL or POSTGRES_HOST/POSTGRES_PORT/POSTGRES_DB/POSTGRES_USER/POSTGRES_PASSWORD.");
}

const pool = new Pool({ connectionString: config.databaseUrl });

/**
 * Parameter binding notes:
 * - Application code should pass native JS numbers for INTEGER columns.
 * - PostgreSQL rejects non-integer strings such as "NaN" for INTEGER fields.
 * - Validate external payload values in route handlers before calling db.prepare(...).run(...).
 */
function toPgSql(sql) {
  let i = 0;
  return sql.replace(/\?/g, () => `$${++i}`);
}

function mapRow(row) {
  if (!row) return row;
  const next = { ...row };
  if (typeof next.planting_count === "string") next.planting_count = Number(next.planting_count);
  if (typeof next.count === "string") next.count = Number(next.count);
  return next;
}

const db = {
  prepare(sql) {
    const text = toPgSql(sql);
    return {
      async get(...params) {
        const res = await pool.query(text, params);
        return mapRow(res.rows[0]);
      },
      async all(...params) {
        const res = await pool.query(text, params);
        return res.rows.map(mapRow);
      },
      async run(...params) {
        const res = await pool.query(text, params);
        return { rowCount: res.rowCount };
      }
    };
  },
  async exec(sql) {
    await pool.query(sql);
  },
  async tx(fn) {
    const client = await pool.connect();
    const txDb = {
      prepare(sql) {
        const text = toPgSql(sql);
        return {
          async get(...params) {
            const res = await client.query(text, params);
            return mapRow(res.rows[0]);
          },
          async all(...params) {
            const res = await client.query(text, params);
            return res.rows.map(mapRow);
          },
          async run(...params) {
            const res = await client.query(text, params);
            return { rowCount: res.rowCount };
          }
        };
      },
      async exec(sql) { await client.query(sql); }
    };
    try {
      await client.query("BEGIN");
      const out = await fn(txDb);
      await client.query("COMMIT");
      return out;
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally { client.release(); }
  }
};

async function initializeSchema() {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS species (
      id INTEGER PRIMARY KEY,
      common_name TEXT NOT NULL,
      scientific_name TEXT,
      family TEXT,
      pruning_period TEXT,
      flowering_period TEXT,
      care_tips TEXT,
      notes TEXT,
      external_links_json TEXT,
      created_at TIMESTAMPTZ NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL
    );
    CREATE TABLE IF NOT EXISTS zones (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      created_at TIMESTAMPTZ NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL
    );
    CREATE TABLE IF NOT EXISTS zone_geometries (
      id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      zone_id INTEGER NOT NULL REFERENCES zones(id) ON DELETE CASCADE,
      geometry_json TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL
    );
    CREATE TABLE IF NOT EXISTS plantations (
      id INTEGER PRIMARY KEY,
      species_id INTEGER NOT NULL REFERENCES species(id) ON DELETE RESTRICT,
      zone_id INTEGER REFERENCES zones(id) ON DELETE SET NULL,
      planted_at TEXT,
      quantity INTEGER,
      notes TEXT,
      nickname TEXT,
      position_json TEXT,
      created_at TIMESTAMPTZ NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL
    );
    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY,
      plant_instance_id INTEGER,
      zone_id INTEGER,
      due_date TEXT,
      action TEXT,
      status TEXT,
      notes TEXT,
      created_at TIMESTAMPTZ NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL
    );
    CREATE TABLE IF NOT EXISTS species_photos (
      id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      species_id INTEGER NOT NULL REFERENCES species(id) ON DELETE CASCADE,
      filename TEXT NOT NULL,
      original_filename TEXT,
      mime_type TEXT NOT NULL,
      relative_path TEXT NOT NULL,
      size_bytes INTEGER,
      created_at TIMESTAMPTZ NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0
    );
    CREATE INDEX IF NOT EXISTS idx_plantations_zone_id ON plantations(zone_id);
  `);
}

module.exports = { db, initializeSchema };
