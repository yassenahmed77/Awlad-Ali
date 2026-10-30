import React from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, ShoppingBag } from "lucide-react";
import { PRODUCTS } from "@/data/menu.data";
import { storeConfig } from "@/config/theme.config";
import { generateProductSchema } from "@/lib/seo";
import { formatCurrency } from "@/lib/utils";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const product = PRODUCTS.find((p) => p.slug === slug || p.id === slug);

  if (!product) {
    return { title: "الصنف غير موجود | أولاد علي" };
  }

  return {
    title: `${product.name} - منيو ${storeConfig.name} شبرا مصر`,
    description: `${product.description}. اطلب أونلاين الآن من مطعم أولاد علي روض الفرج شبرا مصر واستلم طلبك طازة وسريع.`,
    openGraph: {
      title: `${product.name} - ${storeConfig.name}`,
      description: product.description,
      images: [{ url: product.image, width: 800, height: 600, alt: product.name }],
    },
  };
}

export default async function ProductSeoPage({ params }) {
  const { slug } = await params;
  const product = PRODUCTS.find((p) => p.slug === slug || p.id === slug);

  if (!product) {
    notFound();
  }

  const productJsonLd = generateProductSchema(product);

  return (
    <main className="min-h-screen bg-surface pb-16 text-right font-sans">
      {/* Inject Product JSON-LD for Google rich snippet */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />

      <div className="max-w-md mx-auto px-4 pt-4 space-y-4">
        {/* Back Link */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-700 bg-white px-3.5 py-2 rounded-xl border border-surface-border hover:bg-brand-50 transition-colors shadow-sm"
        >
          <ArrowRight className="w-4 h-4" />
          <span>العودة للمنيو الرئيسي</span>
        </Link>

        {/* Product Card */}
        <div className="bg-white rounded-3xl border border-surface-border p-5 space-y-4 shadow-sm overflow-hidden">
          {/* Main Image */}
          <div className="relative w-full h-64 rounded-2xl overflow-hidden bg-slate-100">
            <Image
              src={product.image}
              alt={product.name}
              fill
              priority
              className="object-cover"
            />
          </div>

          <div className="space-y-1">
            <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-brand-50 text-brand-700 border border-brand-200">
              {product.categoryName}
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-text-primary">
              {product.name}
            </h1>
            <p className="text-xs sm:text-sm text-text-secondary leading-relaxed pt-1">
              {product.description}
            </p>
          </div>

          {/* Info Badges */}
          <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 rounded-2xl border border-slate-100 text-center text-xs">
            <div>
              <span className="text-text-muted text-[11px] block">الفرع</span>
              <span className="font-bold text-text-primary">{product.branch || "روض الفرج"}</span>
            </div>
            <div className="border-x border-slate-200">
              <span className="text-text-muted text-[11px] block">التحضير</span>
              <span className="font-bold text-text-primary">{product.prepTime}</span>
            </div>
            <div>
              <span className="text-text-muted text-[11px] block">التقييم</span>
              <span className="font-bold text-amber-600">5.0 ⭐</span>
            </div>
          </div>

          {/* Sizes */}
          {product.sizes && product.sizes.length > 0 && (
            <div className="space-y-2 pt-2">
              <h2 className="text-sm font-bold text-text-primary">الأحجام والأسعار:</h2>
              <div className="grid grid-cols-2 gap-2">
                {product.sizes.map((s) => (
                  <div
                    key={s.id}
                    className="flex justify-between items-center p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold"
                  >
                    <span className="text-brand-700">{formatCurrency(s.price)}</span>
                    <span className="text-text-primary">{s.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Order CTA */}
          <div className="pt-4 border-t border-slate-100">
            <Link
              href="/"
              className="w-full inline-flex items-center justify-center gap-2 h-12 rounded-2xl bg-brand-700 text-white font-bold text-sm hover:bg-brand-800 transition-colors shadow-md"
            >
              <ShoppingBag className="w-5 h-5" />
              <span>اطلب الآن أونلاين واستلم فوراً</span>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

