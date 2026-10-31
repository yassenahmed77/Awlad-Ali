import "./globals.css";
import { storeConfig } from "@/config/theme.config";
import { generateRestaurantSchema } from "@/lib/seo";
import { CartProvider } from "@/context/CartContext";

export const metadata = {
  title: `${storeConfig.name} - فطائر وبيتزا أولاد علي`,
  description:
    "منيو مطعم أولاد علي - روض الفرج، شبرا مصر. بيتزا إيطالي وشرقي، فطائر ومشلتت، كريب، شاورما، فراخ مشوية وبروستد.",
  manifest: "/manifest.json",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://awlad-ali.vercel.app"),
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/logo.svg", type: "image/svg+xml" },
      { url: "/logo.png", sizes: "192x192", type: "image/png" },
    ],
    shortcut: "/favicon.svg",
    apple: "/logo.png",
  },
  openGraph: {
    title: `${storeConfig.name} - أصل الفطير والبيتزا في مصر 🔥`,
    description: "أسرع دليفري في شبرا - اطلب أونلاين فوراً واستلم طلبك طازة وسخن من الفرن لحد باب بيتك!",
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
        {/* Browser Favicon & Mobile Touch Icons */}
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="alternate icon" href="/logo.svg" type="image/svg+xml" />
        <link rel="shortcut icon" href="/favicon.svg" />
        <link rel="apple-touch-icon" href="/logo.png" />
        {/* iOS PWA Standalone Support */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="أولاد علي" />
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
