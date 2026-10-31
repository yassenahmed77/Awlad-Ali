/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Cairo", "Tahoma", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
        cairo: ["Cairo", "sans-serif"],
      },
      colors: {
        brand: {
          50: "#eaf8ee",
          100: "#d0f0db",
          200: "#a6e2bc",
          300: "#6ecc96",
          400: "#3bb170",
          500: "#1b9552",
          600: "#0f7a3f",
          700: "#096633",
          800: "#08522b",
          900: "#064324",
          950: "#022513",
        },
        accent: {
          50: "#fffbeb",
          100: "#fef3c7",
          200: "#fde68a",
          300: "#fcd34d",
          400: "#fbbf24",
          500: "#f59e0b",
          600: "#d97706",
        },
        surface: {
          DEFAULT: "#fcfcfd",
          card: "#ffffff",
          muted: "#f8fafc",
          border: "#eaedf1",
        },
      },
      borderRadius: {
        "2xl": "18px",
        "3xl": "24px",
        "4xl": "32px",
      },
      boxShadow: {
        card: "0 2px 10px rgba(0, 0, 0, 0.03)",
        elevated: "0 10px 30px rgba(9, 102, 51, 0.15)",
      },
      animation: {
        "cart-bounce": "cartBounce 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
        "slide-up": "slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        "fade-in": "fadeIn 0.2s ease-out",
      },
      keyframes: {
        cartBounce: {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.2)" },
        },
        slideUp: {
          "0%": { transform: "translateY(100%)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};
