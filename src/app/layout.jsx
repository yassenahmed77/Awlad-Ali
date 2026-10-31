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
  themeColor: "#0b6638",
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
          href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
        {/* iOS PWA Standalone Support */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="أولاد علي" />
        <link rel="apple-touch-icon" href="/logo.svg" />
        {/* Dev Environment Auto-Purge: Wipes stale service workers & caches on localhost / Registers in production */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
                var isDev = window.location.hostname === 'localhost' || 
                            window.location.hostname === '127.0.0.1' || 
                            window.location.hostname.endsWith('.local');
                if (isDev) {
                  navigator.serviceWorker.getRegistrations().then(function(regs) {
                    for (var i = 0; i < regs.length; i++) {
                      regs[i].unregister();
                    }
                  });
                  if ('caches' in window) {
                    caches.keys().then(function(names) {
                      for (var i = 0; i < names.length; i++) {
                        caches.delete(names[i]);
                      }
                    });
                  }
                } else {
                  window.addEventListener('load', function() {
                    navigator.serviceWorker.register('/sw.js').catch(function(){});
                  });
                }
              }
            `,
          }}
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
