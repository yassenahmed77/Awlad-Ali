/**
 * Delivery Zones & Geofencing System (Clean Architecture)
 * Configures restaurant location, allowed delivery zones, fees, and distance verification.
 */

export const BRANCH_LOCATION = {
  name: "أولاد علي - فرع روض الفرج",
  address: "2 شارع روض الفرج، شبرا، القاهرة",
  latitude: 30.0768,
  longitude: 31.2458,
  maxDeliveryRadiusKm: 8.5,
};

export const DELIVERY_ZONES = [
  {
    id: "rod-el-farag",
    name: "روض الفرج والشوارع المجاورة",
    area: "شبرا",
    fee: 15,
    estimatedMinutes: "20 - 30 دقيقة",
    isCovered: true,
  },
  {
    id: "shubra-misr",
    name: "شبرا مصر والخلفاوي",
    area: "شبرا",
    fee: 15,
    estimatedMinutes: "25 - 35 دقيقة",
    isCovered: true,
  },
  {
    id: "sahel-teraa",
    name: "الساحل والترعة البولاقية",
    area: "شبرا",
    fee: 15,
    estimatedMinutes: "25 - 35 دقيقة",
    isCovered: true,
  },
  {
    id: "dowaran-kholousy",
    name: "دوران شبرا، خلوصي وأحمد بدوي",
    area: "شبرا",
    fee: 15,
    estimatedMinutes: "25 - 35 دقيقة",
    isCovered: true,
  },
  {
    id: "el-zawya",
    name: "الزاوية الحمراء والقصيرين",
    area: "شمال القاهرة",
    fee: 20,
    estimatedMinutes: "30 - 40 دقيقة",
    isCovered: true,
  },
  {
    id: "el-sharabeya",
    name: "الشرابية ومهمشة",
    area: "شمال القاهرة",
    fee: 20,
    estimatedMinutes: "30 - 40 دقيقة",
    isCovered: true,
  },
  {
    id: "bulaq-corniche",
    name: "بولاق أبو العلا وكورنيش النيل",
    area: "وسط القاهرة",
    fee: 25,
    estimatedMinutes: "30 - 40 دقيقة",
    isCovered: true,
  },
  {
    id: "downtown-ramsis",
    name: "وسط البلد، رمسيس والأزبكية",
    area: "وسط القاهرة",
    fee: 25,
    estimatedMinutes: "35 - 45 دقيقة",
    isCovered: true,
  },
  {
    id: "abbaseya-wayly",
    name: "العباسية والوايلي",
    area: "وسط القاهرة",
    fee: 30,
    estimatedMinutes: "40 - 50 دقيقة",
    isCovered: true,
  },
  {
    id: "other",
    name: "منطقة أخرى (خارج نطاق التوصيل السريع حالياً)",
    area: "أخرى",
    fee: 0,
    estimatedMinutes: "غير متاح",
    isCovered: false,
  },
];

/**
 * Calculate geographical straight-line distance in kilometers using Haversine formula
 */
export function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return Math.round(distance * 10) / 10; // Round to 1 decimal place (e.g. 3.4 km)
}

/**
 * Verify if GPS coordinates are within Awlad Ali delivery radius
 * Computes dynamic fee based on real kilometers
 */
export function verifyGpsCoordinates(lat, lng, branch = BRANCH_LOCATION) {
  if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
    return { isValid: false, inZone: false, error: "إحداثيات الموقع غير صحيحة" };
  }

  const branchConfig = branch || BRANCH_LOCATION;
  const distanceKm = calculateDistanceKm(
    branchConfig.latitude,
    branchConfig.longitude,
    Number(lat),
    Number(lng)
  );

  const googleMapsUrl = `https://maps.google.com/?q=${lat},${lng}`;

  if (distanceKm > branchConfig.maxDeliveryRadiusKm) {
    return {
      isValid: true,
      inZone: false,
      distanceKm,
      googleMapsUrl,
      error: `عفواً، موقعك يبعد (${distanceKm} كم) عن الفرع ويقع خارج نطاق التوصيل السريع (الحد الأقصى ${branchConfig.maxDeliveryRadiusKm} كم).`,
    };
  }

  return {
    isValid: true,
    inZone: true,
    distanceKm,
    googleMapsUrl,
    message: `موقعك داخل نطاق التوصيل (على بُعد ${distanceKm} كم من الفرع) ✅`,
  };
}

