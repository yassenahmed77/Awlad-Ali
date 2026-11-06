import { createClient } from "@libsql/client";
import {
  BRANCH_LOCATION as DEFAULT_BRANCH,
  DELIVERY_ZONES,
} from "../config/deliveryZones.config.js";

/**
 * Currency Utility: Convert Egyptian Pounds to integer Piastres (1 EGP = 100 Piastres / Qirsh)
 * Rejects NaN, Infinity, negative, or non-finite inputs strictly.
 */
export function toPiastres(egp) {
  if (egp === undefined || egp === null || typeof egp !== "number" || !Number.isFinite(egp)) {
    throw new TypeError(`Invalid monetary amount: expected finite number, received ${egp}`);
  }
  if (egp < 0) {
    throw new RangeError(`Invalid monetary amount: expected positive value, received ${egp}`);
  }
  return Math.round(egp * 100);
}

/**
 * Currency Utility: Convert integer Piastres back to Egyptian Pounds (e.g. 15050 -> 150.50)
 */
export function toEgp(piastres) {
  if (piastres === undefined || piastres === null || typeof piastres !== "number" || !Number.isFinite(piastres)) {
    throw new TypeError(`Invalid piastres amount: expected finite number, received ${piastres}`);
  }
  return Math.round(piastres) / 100;
}

/**
 * Global database singleton with Strict Production Environment Enforcement.
 */
let dbClientInstance = null;

export function getDbClient() {
  if (!dbClientInstance) {
    const isProduction =
      process.env.NODE_ENV === "production" || process.env.VERCEL_ENV === "production";
    const url = process.env.TURSO_DATABASE_URL;
    const authToken = process.env.TURSO_AUTH_TOKEN;

    // CRITICAL: Block accidental in-memory fallback in Production
    if (isProduction && (!url || typeof url !== "string" || !url.trim())) {
      throw new Error(
        "FATAL PRODUCTION CONFIG ERROR: TURSO_DATABASE_URL is not defined in environment variables! " +
        "Refusing to boot with ephemeral fallback to protect customer order data from loss."
      );
    }

    const resolvedUrl = url && url.trim() ? url.trim() : "file::memory:";

    dbClientInstance = createClient({
      url: resolvedUrl,
      authToken: authToken || undefined,
    });
  }
  return dbClientInstance;
}

/**
 * Execute an async read-only database operation with automatic retry on transient network errors.
 * NOTE: NEVER used for write operations (INSERT/UPDATE/DELETE) to prevent ambiguous double-commits.
 */
async function withReadRetry(operation, maxRetries = 2, baseDelayMs = 150) {
  let attempt = 0;
  while (true) {
    try {
      return await operation();
    } catch (err) {
      attempt++;
      const isTransient =
        err &&
        (err.code === "ECONNRESET" ||
          err.code === "ETIMEDOUT" ||
          err.code === "UND_ERR_CONNECT_TIMEOUT" ||
          (err.status && [429, 502, 503, 504].includes(err.status)) ||
          (err.message && (err.message.includes("fetch failed") || err.message.includes("timeout"))));

      if (attempt > maxRetries || !isTransient) {
        throw err;
      }

      const delay = baseDelayMs * Math.pow(2, attempt - 1);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}

/**
 * Parameterized Read Query Execution with transient network retry.
 * Eliminates SQL injection on value boundaries.
 */
export async function query(sql, args = []) {
  const client = getDbClient();
  const res = await withReadRetry(() => client.execute({ sql, args }));

  if (!res.rows || res.rows.length === 0) return [];

  const columns = res.columns || [];
  return res.rows.map((row) => {
    const obj = {};
    columns.forEach((col) => {
      obj[col] = row[col];
    });
    return obj;
  });
}

/**
 * Execute parameterized query and return single row object or null
 */
export async function queryOne(sql, args = []) {
  const rows = await query(sql, args);
  return rows.length > 0 ? rows[0] : null;
}

/**
 * Execute parameterized mutation (INSERT, UPDATE, DELETE).
 * Direct execution WITHOUT blind retries to prevent ambiguous commits and duplicate charges.
 */
export async function execute(sql, args = []) {
  const client = getDbClient();
  const res = await client.execute({ sql, args });
  return {
    rowsAffected: res.rowsAffected || 0,
    lastInsertRowid: res.lastInsertRowid !== undefined ? String(res.lastInsertRowid) : null,
  };
}

/**
 * Execute atomic batch transaction.
 * Direct execution WITHOUT blind retries to prevent ambiguous multi-statement re-execution.
 */
export async function batch(statements) {
  const client = getDbClient();
  return client.batch(statements, "write");
}

/**
 * Health check ping
 */
export async function pingDb() {
  const start = Date.now();
  await query("SELECT 1 as ping");
  return { healthy: true, latencyMs: Date.now() - start };
}

/**
 * Master Versioned Migrations Registry
 */
const MIGRATIONS = [
  {
    id: "001_core_relational_schema",
    description: "Initial relational schema: branch_settings, delivery_zones, orders, order_items, rate_limits, triggers, indexes",
    up: async (client) => {
      // 1. Check if legacy tables exist before creating new ones
      const existingTablesRes = await client.execute(
        "SELECT name FROM sqlite_master WHERE type='table' AND name IN ('orders', 'delivery_zones', 'order_items')"
      );
      const existingTables = new Set((existingTablesRes.rows || []).map((r) => r.name));

      // If delivery_zones exists, check if fee_piastres column is present
      if (existingTables.has("delivery_zones")) {
        const info = await client.execute("PRAGMA table_info(delivery_zones)");
        const cols = new Set((info.rows || []).map((r) => r.name));
        if (!cols.has("fee_piastres")) {
          await client.execute("ALTER TABLE delivery_zones ADD COLUMN fee_piastres INTEGER DEFAULT 0");
          if (cols.has("fee")) {
            await client.execute("UPDATE delivery_zones SET fee_piastres = CAST(ROUND(fee * 100) AS INTEGER)");
          }
        }
      }

      // If orders exists, check if subtotal_piastres column is present
      if (existingTables.has("orders")) {
        const info = await client.execute("PRAGMA table_info(orders)");
        const cols = new Set((info.rows || []).map((r) => r.name));
        if (!cols.has("subtotal_piastres")) {
          await client.execute("ALTER TABLE orders ADD COLUMN subtotal_piastres INTEGER DEFAULT 0");
          await client.execute("ALTER TABLE orders ADD COLUMN delivery_fee_piastres INTEGER DEFAULT 0");
          await client.execute("ALTER TABLE orders ADD COLUMN total_amount_piastres INTEGER DEFAULT 0");
          if (cols.has("subtotal")) {
            await client.execute(`
              UPDATE orders SET 
                subtotal_piastres = CAST(ROUND(COALESCE(subtotal, 0) * 100) AS INTEGER),
                delivery_fee_piastres = CAST(ROUND(COALESCE(delivery_fee, 0) * 100) AS INTEGER),
                total_amount_piastres = CAST(ROUND(COALESCE(total_amount, 0) * 100) AS INTEGER)
            `);
          }
        }
        if (!cols.has("idempotency_key")) {
          await client.execute("ALTER TABLE orders ADD COLUMN idempotency_key TEXT");
        }
        if (!cols.has("delivery_zone_id")) {
          await client.execute("ALTER TABLE orders ADD COLUMN delivery_zone_id TEXT");
        }
        if (!cols.has("delivery_zone_name")) {
          await client.execute("ALTER TABLE orders ADD COLUMN delivery_zone_name TEXT DEFAULT ''");
          if (cols.has("delivery_zone")) {
            await client.execute("UPDATE orders SET delivery_zone_name = COALESCE(delivery_zone, '')");
          }
        }
        if (!cols.has("payment_method")) {
          await client.execute("ALTER TABLE orders ADD COLUMN payment_method TEXT DEFAULT 'cash'");
        }
        if (!cols.has("payment_status")) {
          await client.execute("ALTER TABLE orders ADD COLUMN payment_status TEXT DEFAULT 'unpaid'");
        }
      }

      // If order_items exists, check if unit_price_piastres is present
      if (existingTables.has("order_items")) {
        const info = await client.execute("PRAGMA table_info(order_items)");
        const cols = new Set((info.rows || []).map((r) => r.name));
        if (!cols.has("unit_price_piastres")) {
          await client.execute("ALTER TABLE order_items ADD COLUMN unit_price_piastres INTEGER DEFAULT 0");
          await client.execute("ALTER TABLE order_items ADD COLUMN item_total_piastres INTEGER DEFAULT 0");
          if (cols.has("unit_price")) {
            await client.execute(`
              UPDATE order_items SET 
                unit_price_piastres = CAST(ROUND(COALESCE(unit_price, 0) * 100) AS INTEGER),
                item_total_piastres = CAST(ROUND(COALESCE(item_total, 0) * 100) AS INTEGER)
            `);
          }
        }
        if (!cols.has("selected_addons_json")) {
          await client.execute("ALTER TABLE order_items ADD COLUMN selected_addons_json TEXT DEFAULT '[]'");
        }
        if (!cols.has("selected_size_id")) {
          await client.execute("ALTER TABLE order_items ADD COLUMN selected_size_id TEXT");
        }
      }

      // 2. Ensure modern tables, constraints, indexes & recursion-safe triggers exist
      await client.executeMultiple(`
        CREATE TABLE IF NOT EXISTS branch_settings (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL CHECK(length(trim(name)) >= 2 AND length(name) <= 100),
          address TEXT NOT NULL CHECK(length(trim(address)) >= 5 AND length(address) <= 300),
          latitude REAL NOT NULL CHECK(latitude >= -90.0 AND latitude <= 90.0),
          longitude REAL NOT NULL CHECK(longitude >= -180.0 AND longitude <= 180.0),
          max_delivery_radius_km REAL NOT NULL CHECK(max_delivery_radius_km > 0.0 AND max_delivery_radius_km <= 100.0),
          updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS delivery_zones (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL UNIQUE CHECK(length(trim(name)) >= 2 AND length(name) <= 100),
          area TEXT NOT NULL CHECK(length(trim(area)) >= 2 AND length(area) <= 50),
          fee_piastres INTEGER NOT NULL CHECK(fee_piastres >= 0),
          estimated_minutes TEXT NOT NULL CHECK(length(trim(estimated_minutes)) >= 2 AND length(estimated_minutes) <= 50),
          is_covered INTEGER NOT NULL DEFAULT 1 CHECK(is_covered IN (0, 1)),
          created_at TEXT NOT NULL DEFAULT (datetime('now')),
          updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS orders (
          id TEXT PRIMARY KEY,
          idempotency_key TEXT UNIQUE,
          customer_name TEXT NOT NULL CHECK(length(trim(customer_name)) >= 2 AND length(customer_name) <= 100),
          customer_phone TEXT NOT NULL CHECK(customer_phone GLOB '01[0125][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9]'),
          order_type TEXT NOT NULL CHECK(order_type IN ('delivery', 'pickup')),
          customer_address TEXT NOT NULL DEFAULT '' CHECK(length(customer_address) <= 300),
          delivery_zone_id TEXT REFERENCES delivery_zones(id) ON DELETE RESTRICT,
          delivery_zone_name TEXT NOT NULL DEFAULT '' CHECK(length(delivery_zone_name) <= 100),
          google_maps_url TEXT NOT NULL DEFAULT '' CHECK(length(google_maps_url) <= 500),
          notes TEXT NOT NULL DEFAULT '' CHECK(length(notes) <= 500),
          status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'preparing', 'ready', 'completed', 'cancelled')),
          payment_method TEXT NOT NULL DEFAULT 'cash' CHECK(payment_method IN ('cash', 'card', 'instapay')),
          payment_status TEXT NOT NULL DEFAULT 'unpaid' CHECK(payment_status IN ('unpaid', 'paid', 'refunded')),
          subtotal_piastres INTEGER NOT NULL CHECK(subtotal_piastres >= 0),
          delivery_fee_piastres INTEGER NOT NULL CHECK(delivery_fee_piastres >= 0),
          total_amount_piastres INTEGER NOT NULL CHECK(total_amount_piastres >= 0),
          created_at TEXT NOT NULL DEFAULT (datetime('now')),
          updated_at TEXT NOT NULL DEFAULT (datetime('now')),
          CONSTRAINT chk_order_total_math CHECK (total_amount_piastres = subtotal_piastres + delivery_fee_piastres),
          CONSTRAINT chk_pickup_rules CHECK (order_type != 'pickup' OR (delivery_zone_id IS NULL AND delivery_fee_piastres = 0 AND delivery_zone_name = '')),
          CONSTRAINT chk_delivery_rules CHECK (
            order_type != 'delivery' OR (
              delivery_zone_id IS NOT NULL AND 
              length(trim(customer_address)) >= 5
            )
          )
        );

        CREATE TABLE IF NOT EXISTS order_items (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
          product_id TEXT NOT NULL CHECK(length(product_id) <= 100),
          product_name TEXT NOT NULL CHECK(length(product_name) <= 150),
          selected_size_id TEXT CHECK(selected_size_id IS NULL OR length(selected_size_id) <= 50),
          selected_size_name TEXT CHECK(selected_size_name IS NULL OR length(selected_size_name) <= 50),
          selected_addons_json TEXT NOT NULL DEFAULT '[]' CHECK(json_valid(selected_addons_json)),
          unit_price_piastres INTEGER NOT NULL CHECK(unit_price_piastres >= 0),
          quantity INTEGER NOT NULL CHECK(quantity >= 1 AND quantity <= 99),
          item_total_piastres INTEGER NOT NULL CHECK(item_total_piastres >= 0),
          CONSTRAINT chk_item_math CHECK (item_total_piastres = unit_price_piastres * quantity)
        );

        CREATE TABLE IF NOT EXISTS rate_limits (
          key TEXT PRIMARY KEY,
          points INTEGER NOT NULL DEFAULT 1,
          expire_at INTEGER NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_rate_limits_expire ON rate_limits(expire_at);
        CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
        CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_orders_phone ON orders(customer_phone);
        CREATE INDEX IF NOT EXISTS idx_orders_idempotency ON orders(idempotency_key);
        CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);

        CREATE TRIGGER IF NOT EXISTS trg_orders_updated_at AFTER UPDATE OF status, customer_name, customer_phone, customer_address, notes, payment_status, payment_method ON orders
        BEGIN
          UPDATE orders SET updated_at = datetime('now') WHERE id = NEW.id;
        END;

        CREATE TRIGGER IF NOT EXISTS trg_delivery_zones_updated_at AFTER UPDATE OF name, area, fee_piastres, estimated_minutes, is_covered ON delivery_zones
        BEGIN
          UPDATE delivery_zones SET updated_at = datetime('now') WHERE id = NEW.id;
        END;

        CREATE TRIGGER IF NOT EXISTS trg_branch_settings_updated_at AFTER UPDATE OF name, address, latitude, longitude, max_delivery_radius_km ON branch_settings
        BEGIN
          UPDATE branch_settings SET updated_at = datetime('now') WHERE id = NEW.id;
        END;
      `);
    },
  },
];

/**
 * Versioned Migration System & Idempotent Schema Initializer.
 */
export async function initDatabase() {
  const client = getDbClient();

  // 1. Enforce Foreign Keys on connection
  await client.execute("PRAGMA foreign_keys = ON;");

  // 2. Ensure Migrations tracking table exists
  await client.execute(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // 3. Sequentially apply pending migrations
  const appliedRows = await query("SELECT id FROM _migrations");
  const appliedSet = new Set(appliedRows.map((r) => r.id));

  for (const migration of MIGRATIONS) {
    if (!appliedSet.has(migration.id)) {
      await migration.up(client);
      await client.execute({
        sql: "INSERT INTO _migrations (id) VALUES (?)",
        args: [migration.id],
      });
      appliedSet.add(migration.id);
    }
  }

  // 4. Initial Seed for Delivery Zones with ON CONFLICT DO NOTHING (Never overwrites Admin edits!)
  const seedStatements = DELIVERY_ZONES.map((zone) => ({
    sql: `INSERT INTO delivery_zones (id, name, area, fee_piastres, estimated_minutes, is_covered)
          VALUES (?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO NOTHING`,
    args: [
      zone.id,
      zone.name,
      zone.area,
      toPiastres(zone.fee),
      zone.estimatedMinutes || "غير متاح",
      zone.isCovered ? 1 : 0,
    ],
  }));

  await client.batch(seedStatements, "write");

  // 5. Initial Seed for Branch Settings with ON CONFLICT DO NOTHING (Never overwrites Admin coordinates!)
  await client.execute({
    sql: `INSERT INTO branch_settings (id, name, address, latitude, longitude, max_delivery_radius_km)
          VALUES (?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO NOTHING`,
    args: [
      "primary",
      DEFAULT_BRANCH.name,
      DEFAULT_BRANCH.address,
      DEFAULT_BRANCH.latitude,
      DEFAULT_BRANCH.longitude,
      DEFAULT_BRANCH.maxDeliveryRadiusKm,
    ],
  });

  // 6. Verify Foreign Key integrity post-initialization
  const fkErrors = await client.execute("PRAGMA foreign_key_check;");
  if (fkErrors.rows && fkErrors.rows.length > 0) {
    throw new Error(
      `Database Initialization Failed: Foreign key violations detected: ${JSON.stringify(fkErrors.rows)}`
    );
  }

  return { success: true };
}

/**
 * Shared Global Initialization Promise Singleton.
 * Guarantees that multiple concurrent services await the exact same database initialization.
 */
let initPromise = null;

export function ensureDatabaseInitialized() {
  if (!initPromise) {
    initPromise = initDatabase().catch((err) => {
      initPromise = null; // Reset so subsequent requests can retry on transient failures
      throw err;
    });
  }
  return initPromise;
}
