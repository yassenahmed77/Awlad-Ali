import { CATEGORIES, PRODUCTS } from "@/data/menu.data";

// In-memory products store for instant mutation (e.g., cashier toggles availability)
let runtimeProducts = [...PRODUCTS];

export const productsService = {
  /**
   * Get all menu categories
   */
  async getCategories() {
    return CATEGORIES;
  },

  /**
   * Get all products, optionally filtered by category
   */
  async getProducts({ categoryId = "all", searchQuery = "", onlyAvailable = false } = {}) {
    let list = [...runtimeProducts];

    if (categoryId && categoryId !== "all") {
      list = list.filter((p) => p.category === categoryId);
    }

    if (searchQuery && searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.categoryName.toLowerCase().includes(q)
      );
    }

    if (onlyAvailable) {
      list = list.filter((p) => p.isAvailable);
    }

    return list;
  },

  /**
   * Find product by id or slug
   */
  async getProductBySlug(slug) {
    return runtimeProducts.find((p) => p.slug === slug || p.id === slug) || null;
  },

  /**
   * Cashier action: toggle product availability (Out of Stock / Available)
   */
  async toggleAvailability(productId) {
    const product = runtimeProducts.find((p) => p.id === productId);
    if (product) {
      product.isAvailable = !product.isAvailable;
      return { success: true, product };
    }
    return { success: false, error: "المنتج غير موجود" };
  },

  /**
   * Add or update product (Admin action)
   */
  async saveProduct(productData) {
    const index = runtimeProducts.findIndex((p) => p.id === productData.id);
    if (index >= 0) {
      runtimeProducts[index] = { ...runtimeProducts[index], ...productData };
      return runtimeProducts[index];
    } else {
      const newProduct = {
        ...productData,
        id: productData.id || `prod-${Date.now()}`,
        slug: productData.slug || `prod-${Date.now()}`,
        isAvailable: true,
      };
      runtimeProducts.unshift(newProduct);
      return newProduct;
    }
  },
};

