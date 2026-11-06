import {
  ensureDatabaseInitialized,
  query,
  queryOne,
  execute,
  toPiastres,
  toEgp,
} from "../lib/db.js";
import {
  BRANCH_LOCATION as DEFAULT_BRANCH,
  calculateDistanceKm,
} from "../config/deliveryZones.config.js";
import { sanitizeText } from "../lib/sanitizer.js";

function formatZoneRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    area: row.area,
    fee: toEgp(row.fee_piastres),
    feePiastres: row.fee_piastres,
    estimatedMinutes: row.estimated_minutes,
    isCovered: row.is_covered === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const deliveryZonesService = {
  /**
   * Get all zones with optional filtering from database
   */
  async getZones({ onlyCovered = false, area = null } = {}) {
    await ensureDatabaseInitialized();

    let sql = "SELECT * FROM delivery_zones WHERE 1=1";
    const args = [];

    if (onlyCovered) {
      sql += " AND is_covered = 1";
    }

    if (area && area !== "all") {
      sql += " AND area = ?";
      args.push(area);
    }

    sql += " ORDER BY fee_piastres ASC, name ASC";

    const rows = await query(sql, args);
    return rows.map(formatZoneRow);
  },

  /**
   * Get a single zone by ID
   */
  async getZoneById(id) {
    if (!id) return null;
    await ensureDatabaseInitialized();

    const row = await queryOne("SELECT * FROM delivery_zones WHERE id = ?", [id]);
    return formatZoneRow(row);
  },

  /**
   * Get branch settings and maximum delivery radius directly from database (Persistent across Serverless cold starts)
   */
  async getBranchConfig() {
    await ensureDatabaseInitialized();

    const row = await queryOne(
      "SELECT id, name, address, latitude, longitude, max_delivery_radius_km as maxDeliveryRadiusKm FROM branch_settings WHERE id = 'primary'"
    );

    if (!row) {
      return { ...DEFAULT_BRANCH };
    }

    return {
      name: row.name,
      address: row.address,
      latitude: Number(row.latitude),
      longitude: Number(row.longitude),
      maxDeliveryRadiusKm: Number(row.maxDeliveryRadiusKm),
    };
  },

  /**
   * Update branch location coordinates or max delivery radius in database with strict bounds validation
   */
  async updateBranchConfig(updates = {}) {
    await ensureDatabaseInitialized();
    const current = await this.getBranchConfig();

    let newRadius = current.maxDeliveryRadiusKm;
    let newLat = current.latitude;
    let newLng = current.longitude;
    let newName = current.name;
    let newAddress = current.address;

    if (updates.maxDeliveryRadiusKm !== undefined) {
      const radius = Number(updates.maxDeliveryRadiusKm);
      if (!Number.isFinite(radius) || radius <= 0 || radius > 100) {
        throw new Error("نطاق التوصيل يجب أن يكون رقماً صحيحاً أو عشرياً بين 0.1 و 100 كم");
      }
      newRadius = Math.round(radius * 10) / 10;
    }

    if (updates.latitude !== undefined) {
      const lat = Number(updates.latitude);
      if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
        throw new Error("خط العرض (Latitude) غير صحيح. يجب أن يكون بين -90 و 90");
      }
      newLat = lat;
    }

    if (updates.longitude !== undefined) {
      const lng = Number(updates.longitude);
      if (!Number.isFinite(lng) || lng < -180 || lng > 180) {
        throw new Error("خط الطول (Longitude) غير صحيح. يجب أن يكون بين -180 و 180");
      }
      newLng = lng;
    }

    if (updates.name !== undefined) {
      const cleanName = sanitizeText(updates.name, 100);
      if (cleanName.length < 2) {
        throw new Error("اسم الفرع يجب أن يكون حرفين على الأقل");
      }
      newName = cleanName;
    }

    if (updates.address !== undefined) {
      const cleanAddr = sanitizeText(updates.address, 300);
      if (cleanAddr.length < 5) {
        throw new Error("عنوان الفرع يجب أن يكون 5 أحرف على الأقل");
      }
      newAddress = cleanAddr;
    }

    await execute(
      `INSERT INTO branch_settings (id, name, address, latitude, longitude, max_delivery_radius_km, updated_at)
       VALUES ('primary', ?, ?, ?, ?, ?, datetime('now'))
       ON CONFLICT(id) DO UPDATE SET
         name = excluded.name,
         address = excluded.address,
         latitude = excluded.latitude,
         longitude = excluded.longitude,
         max_delivery_radius_km = excluded.max_delivery_radius_km,
         updated_at = datetime('now')`,
      [newName, newAddress, newLat, newLng, newRadius]
    );

    return this.getBranchConfig();
  },

  /**
   * Atomic Toggle a zone's coverage status directly in SQL (Prevents race conditions between admins)
   */
  async toggleZoneCoverage(id) {
    if (!id) throw new Error("معرف المنطقة مطلوب");
    await ensureDatabaseInitialized();

    const res = await execute(
      `UPDATE delivery_zones 
       SET is_covered = CASE WHEN is_covered = 1 THEN 0 ELSE 1 END,
           updated_at = datetime('now') 
       WHERE id = ?`,
      [id]
    );

    if (res.rowsAffected === 0) {
      throw new Error("المنطقة غير موجودة");
    }

    return this.getZoneById(id);
  },

  /**
   * Update an existing zone with strict boundary validation
   */
  async updateZone(id, updates = {}) {
    if (!id) throw new Error("معرف المنطقة مطلوب");
    await ensureDatabaseInitialized();

    const current = await this.getZoneById(id);
    if (!current) {
      throw new Error("المنطقة غير موجودة");
    }

    let newName = current.name;
    let newArea = current.area;
    let newMinutes = current.estimatedMinutes;
    let newCovered = current.isCovered ? 1 : 0;
    let newFeePiastres = current.feePiastres;

    if (updates.name !== undefined) {
      const cleanName = sanitizeText(updates.name, 100);
      if (cleanName.length < 2) {
        throw new Error("اسم المنطقة يجب أن يكون حرفين على الأقل");
      }
      newName = cleanName;
    }

    if (updates.area !== undefined) {
      const cleanArea = sanitizeText(updates.area, 50);
      if (cleanArea.length < 2) {
        throw new Error("اسم الحي أو المنطقة يجب أن يكون حرفين على الأقل");
      }
      newArea = cleanArea;
    }

    if (updates.estimatedMinutes !== undefined) {
      const cleanMins = sanitizeText(updates.estimatedMinutes, 50);
      if (cleanMins.length < 2) {
        throw new Error("وقت التوصيل التقديري يجب أن يكون حرفين على الأقل");
      }
      newMinutes = cleanMins;
    }

    if (updates.fee !== undefined) {
      const numFee = Number(updates.fee);
      if (!Number.isFinite(numFee) || numFee < 0) {
        throw new Error("سعر التوصيل يجب أن يكون رقماً صحيحاً أو عشرياً موجباً أو صفراً");
      }
      newFeePiastres = toPiastres(numFee);
    }

    if (updates.isCovered !== undefined) {
      newCovered = updates.isCovered === true || updates.isCovered === 1 || updates.isCovered === "1" ? 1 : 0;
    }

    await execute(
      `UPDATE delivery_zones SET 
        name = ?, 
        area = ?, 
        fee_piastres = ?, 
        estimated_minutes = ?, 
        is_covered = ?, 
        updated_at = datetime('now')
       WHERE id = ?`,
      [newName, newArea, newFeePiastres, newMinutes, newCovered, id]
    );

    return this.getZoneById(id);
  },

  /**
   * Add a new delivery zone with strict input validation
   */
  async addZone({ name, area = "شبرا", fee = 15, estimatedMinutes = "25 - 35 دقيقة", isCovered = true }) {
    await ensureDatabaseInitialized();

    const cleanName = sanitizeText(name, 100);
    if (cleanName.length < 2) {
      throw new Error("اسم المنطقة يجب أن يكون حرفين على الأقل");
    }

    const cleanArea = sanitizeText(area, 50);
    if (cleanArea.length < 2) {
      throw new Error("اسم الحي أو المنطقة يجب أن يكون حرفين على الأقل");
    }

    const numFee = Number(fee);
    if (!Number.isFinite(numFee) || numFee < 0) {
      throw new Error("سعر التوصيل يجب أن يكون رقماً صحيحاً أو عشرياً موجباً أو صفراً");
    }

    const cleanMinutes = sanitizeText(estimatedMinutes, 50) || "25 - 35 دقيقة";
    if (cleanMinutes.length < 2) {
      throw new Error("وقت التوصيل التقديري يجب أن يكون حرفين على الأقل");
    }

    const feePiastres = toPiastres(numFee);
    const generatedId =
      "zone-" +
      Date.now().toString(36) +
      "-" +
      Math.random().toString(36).substring(2, 6);

    const safeCovered = isCovered === true || isCovered === 1 || isCovered === "1" ? 1 : 0;

    await execute(
      `INSERT INTO delivery_zones (id, name, area, fee_piastres, estimated_minutes, is_covered)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [generatedId, cleanName, cleanArea, feePiastres, cleanMinutes, safeCovered]
    );

    return this.getZoneById(generatedId);
  },

  /**
   * Delete a zone with foreign key integrity protection (ON DELETE RESTRICT)
   */
  async deleteZone(id) {
    if (!id) throw new Error("معرف المنطقة مطلوب");
    await ensureDatabaseInitialized();

    const exists = await this.getZoneById(id);
    if (!exists) {
      throw new Error("المنطقة غير موجودة");
    }

    try {
      await execute("DELETE FROM delivery_zones WHERE id = ?", [id]);
      return { success: true, deletedId: id };
    } catch (err) {
      if (err.message && err.message.includes("FOREIGN KEY")) {
        throw new Error(
          `لا يمكن حذف منطقة "${exists.name}" لأنها مرتبطة بطلبات سابقة في السجل. يمكنك تعطيلها مؤقتاً بدلاً من حذفها للحفاظ على سلامة الحسابات.`
        );
      }
      throw err;
    }
  },

  /**
   * Pure Informational Helper: Calculate distance from branch (for delivery estimation)
   */
  async calculateDistanceFromBranch(lat, lng) {
    const numLat = Number(lat);
    const numLng = Number(lng);
    if (!Number.isFinite(numLat) || !Number.isFinite(numLng)) return null;

    const branch = await this.getBranchConfig();
    return calculateDistanceKm(branch.latitude, branch.longitude, numLat, numLng);
  },

  /**
   * Helper: Generate driver navigation link with strict finite bounds validation (Supports 0,0 accurately)
   */
  generateGoogleMapsUrl(lat, lng) {
    if (lat === undefined || lat === null || lng === undefined || lng === null) return "";
    const numLat = Number(lat);
    const numLng = Number(lng);
    if (
      !Number.isFinite(numLat) ||
      !Number.isFinite(numLng) ||
      numLat < -90 ||
      numLat > 90 ||
      numLng < -180 ||
      numLng > 180
    ) {
      return "";
    }
    return `https://www.google.com/maps/dir/?api=1&destination=${numLat},${numLng}`;
  },
};
