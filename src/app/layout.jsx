import "./globals.css";
import { storeConfig } from "@/config/theme.config";
import { generateRestaurantSchema } from "@/lib/seo";
import { CartProvider } from "@/context/CartContext";

export const metadata = {
  title: `${storeConfig.name} - فطائر وبيتزا أولاد علي | شبرا مصر`,
  description:
    "منيو مطعم أولاد علي - روض الفرج، شبرا مصر. بيتزا إيطالي وشرقي، فطائر ومشلتت، كريب، شاورما، فراخ مشوية وبروستد.",
  manifest: "/manifest.json",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://awlad-ali.vercel.app"),
  openGraph: {
    title: `${storeConfig.name} - أجدع أكل في شبرا 🔥`,
    description: "توصيل ساخن وسريع لجميع مناطق شبرا. اطلب أونلاين فوراً واستلم طلبك طازة!",
    locale: "ar_EG",
    type: "website",
  },
};

export const viewport = {
  themeColor: "#096633",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }) {
  const restaurantSchema = generateRestaurantSchema();

  return (
    <html lang="ar" dir="ltr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(restaurantSchema) }}
        />
      </head>
      <body className="antialiased bg-[#fbfbfb] text-[#1f2937] selection:bg-emerald-100 selection:text-emerald-900 font-sans">
        <CartProvider>
          {children}
        </CartProvider>
      </body>
    </html>
  );
}
