import { storeConfig } from "@/config/theme.config";

/**
 * Generate JSON-LD Schema for LocalBusiness / Restaurant
 * Helps the store rank #1 on Google Local Pack in Shubra
 */
export function generateRestaurantSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    name: storeConfig.name,
    alternateName: storeConfig.nameEn,
    description: storeConfig.tagline,
    telephone: storeConfig.phone,
    address: {
      "@type": "PostalAddress",
      streetAddress: storeConfig.address,
      addressLocality: "شبرا مصر",
      addressRegion: "القاهرة",
      addressCountry: "EG",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: storeConfig.geo.latitude,
      longitude: storeConfig.geo.longitude,
    },
    servesCuisine: ["Egyptian", "Pizza", "Crepe", "Grilled Chicken", "Fast Food"],
    priceRange: "$$",
    openingHours: "Mo-Su 10:00-02:00",
  };
}

/**
 * Generate JSON-LD Schema for Individual Products
 * Google displays price, in-stock badge, and image in search results
 */
export function generateProductSchema(product) {
  const minPrice =
    product.sizes && product.sizes.length > 0
      ? Math.min(...product.sizes.map((s) => s.price))
      : product.basePrice;

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `${product.name} - ${storeConfig.name}`,
    description: product.description,
    image: product.image,
    brand: {
      "@type": "Brand",
      name: storeConfig.name,
    },
    offers: {
      "@type": "Offer",
      price: minPrice,
      priceCurrency: "EGP",
      availability: product.isAvailable
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      seller: {
        "@type": "Restaurant",
        name: storeConfig.name,
      },
    },
  };
}

