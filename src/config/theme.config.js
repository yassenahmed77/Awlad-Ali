/**
 * Single Source of Truth (SSOT) - Theme & Brand System
 * All fluid spacing, color tokens, and visual scales are defined here.
 * Updating values here propagates across the entire app.
 */

export const storeConfig = {
  name: "أولاد علي",
  nameEn: "Awlad Ali",
  tagline: "فطائر وبيتزا أولاد علي",
  phone: "01094467175",
  whatsapp: "201094467175",
  address: "2 شارع روض الفرج، شبرا مصر",
  currency: "ج.م",
  currencyEn: "EGP",
  estimatedPrepTime: "15 - 25 دقيقة",
  minOrderValue: 50,
  deliveryFee: 15,
  isStoreOpen: true,
  openingHours: "10:00 ص - 03:00 ص",
  geo: {
    latitude: 30.0768,
    longitude: 31.2458,
  },
};

export const themeTokens = {
  // Brand Color Palette (HSL based for easy alpha variants)
  colors: {
    primary: {
      DEFAULT: "var(--color-primary)",
      hover: "var(--color-primary-hover)",
      light: "var(--color-primary-light)",
      foreground: "var(--color-primary-fg)",
    },
    secondary: {
      DEFAULT: "var(--color-secondary)",
      hover: "var(--color-secondary-hover)",
      foreground: "var(--color-secondary-fg)",
    },
    accent: {
      DEFAULT: "var(--color-accent)",
      foreground: "var(--color-accent-fg)",
    },
    surface: {
      DEFAULT: "var(--color-surface)",
      muted: "var(--color-surface-muted)",
      card: "var(--color-surface-card)",
      border: "var(--color-surface-border)",
    },
    status: {
      success: "var(--color-status-success)",
      warning: "var(--color-status-warning)",
      danger: "var(--color-status-danger)",
      info: "var(--color-status-info)",
    },
    text: {
      primary: "var(--color-text-primary)",
      secondary: "var(--color-text-secondary)",
      muted: "var(--color-text-muted)",
      inverted: "var(--color-text-inverted)",
    },
  },

  // Fluid clamp typography (Mobile 360px -> Desktop 1280px)
  typography: {
    xs: "clamp(0.75rem, 0.7rem + 0.25vw, 0.8125rem)",       // 12px -> 13px
    sm: "clamp(0.8125rem, 0.77rem + 0.3vw, 0.875rem)",      // 13px -> 14px
    base: "clamp(0.9375rem, 0.88rem + 0.35vw, 1rem)",       // 15px -> 16px
    lg: "clamp(1.0625rem, 1rem + 0.45vw, 1.1875rem)",       // 17px -> 19px
    xl: "clamp(1.25rem, 1.15rem + 0.6vw, 1.45rem)",         // 20px -> 23.2px
    "2xl": "clamp(1.5rem, 1.35rem + 0.85vw, 1.85rem)",      // 24px -> 29.6px
    "3xl": "clamp(1.85rem, 1.65rem + 1.2vw, 2.35rem)",      // 29.6px -> 37.6px
  },

  // Fluid clamp spacing (Mobile -> Desktop)
  spacing: {
    "fluid-2xs": "clamp(0.25rem, 0.2rem + 0.2vw, 0.375rem)", // 4px -> 6px
    "fluid-xs": "clamp(0.375rem, 0.3rem + 0.35vw, 0.5rem)",  // 6px -> 8px
    "fluid-sm": "clamp(0.625rem, 0.55rem + 0.4vw, 0.875rem)", // 10px -> 14px
    "fluid-md": "clamp(0.875rem, 0.75rem + 0.6vw, 1.25rem)", // 14px -> 20px
    "fluid-lg": "clamp(1.25rem, 1.05rem + 0.9vw, 1.875rem)", // 20px -> 30px
    "fluid-xl": "clamp(1.75rem, 1.45rem + 1.35vw, 2.75rem)", // 28px -> 44px
    "fluid-page": "clamp(1rem, 0.8rem + 1vw, 2rem)",         // 16px -> 32px
  },

  // Radii
  radii: {
    sm: "var(--radius-sm)",
    md: "var(--radius-md)",
    lg: "var(--radius-lg)",
    xl: "var(--radius-xl)",
    full: "9999px",
  },
};

