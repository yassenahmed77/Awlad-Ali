-- ============================================================================
-- AWLAD ALI - PRODUCTION RELATIONAL SCHEMA (Turso / LibSQL SQLite)
-- Strict constraints, integer currency (Piastres), foreign keys & zero-drift math
-- ============================================================================

PRAGMA foreign_keys = ON;

-- 0. MIGRATIONS TRACKING TABLE
CREATE TABLE IF NOT EXISTS _migrations (
    id TEXT PRIMARY KEY,
    applied_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 1. BRANCH SETTINGS TABLE (Persistent across Serverless cold starts)
CREATE TABLE IF NOT EXISTS branch_settings (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL CHECK(length(trim(name)) >= 2 AND length(name) <= 100),
    address TEXT NOT NULL CHECK(length(trim(address)) >= 5 AND length(address) <= 300),
    latitude REAL NOT NULL CHECK(latitude >= -90.0 AND latitude <= 90.0),
    longitude REAL NOT NULL CHECK(longitude >= -180.0 AND longitude <= 180.0),
    max_delivery_radius_km REAL NOT NULL CHECK(max_delivery_radius_km > 0.0 AND max_delivery_radius_km <= 100.0),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 2. DELIVERY ZONES TABLE
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

-- 3. ORDERS TABLE
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

    -- Invariant 1: Total must strictly equal subtotal + delivery fee
    CONSTRAINT chk_order_total_math CHECK (total_amount_piastres = subtotal_piastres + delivery_fee_piastres),

    -- Invariant 2: Pickup orders must have strictly zero delivery fee and no delivery zone
    CONSTRAINT chk_pickup_rules CHECK (order_type != 'pickup' OR (delivery_zone_id IS NULL AND delivery_fee_piastres = 0 AND delivery_zone_name = '')),

    -- Invariant 3: Delivery orders must have valid delivery_zone_id and detailed address (>= 5 chars)
    CONSTRAINT chk_delivery_rules CHECK (
        order_type != 'delivery' OR (
            delivery_zone_id IS NOT NULL AND 
            length(trim(customer_address)) >= 5
        )
    )
);

-- 4. ORDER ITEMS TABLE (One-to-Many relational breakdown)
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

    -- Invariant 4: Item total must mathematically match unit_price * quantity
    CONSTRAINT chk_item_math CHECK (item_total_piastres = unit_price_piastres * quantity)
);

-- 5. RATE LIMITS TABLE (Two-Tier Global Sliding Window)
CREATE TABLE IF NOT EXISTS rate_limits (
    key TEXT PRIMARY KEY,
    points INTEGER NOT NULL DEFAULT 1,
    expire_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_rate_limits_expire ON rate_limits(expire_at);

-- 6. PERFORMANCE & SCANNING INDEXES
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_phone ON orders(customer_phone);
CREATE INDEX IF NOT EXISTS idx_orders_idempotency ON orders(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);

-- 7. RECURSION-SAFE AUTOMATIC AUDIT TRIGGERS
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
