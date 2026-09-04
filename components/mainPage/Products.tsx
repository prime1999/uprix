import React from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";

interface ProductItem {
  id: string;
  badge: string;
  title: string;
  description: string;
  features: string[];
  ctaText: string;
  ctaLink: string;
  imageSrc: string;
}

const products: ProductItem[] = [
  {
    id: "x-growth",
    badge: "Resource Vault",
    title: "X-Growth",
    description:
      "Your complete resource vault. X-Growth is packed with practical guides covering everything you need to succeed—from finding your identity and building soft skills, to mastering digital skills and growing a business.",
    features: [
      "Curated skill guides & frameworks",
      "Actionable self-paced learning paths",
      "Direct digital execution playbooks",
    ],
    ctaText: "Explore the Vault",
    ctaLink: "#x-growth",
    imageSrc:
      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "result-room",
    badge: "90-Day Sprint",
    title: "The Result Room",
    description:
      "A strict, 90-day accountability space for those ready to execute. You bring one major goal, and we provide the daily tracking, direct guidance, and strict rules to make sure you achieve it. Slots are limited to keep the focus high.",
    features: [
      "One focus goal with daily tracking",
      "Strict execution check-ins",
      "Capped membership for high impact",
    ],
    ctaText: "Check Availability",
    ctaLink: "#result-room",
    imageSrc:
      "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "uprixtunity",
    badge: "Talent & Brand Spotlight",
    title: "Uprixtunity",
    description:
      "A platform to shine. We believe in supporting our own. Through our 'Brand of the Month' spotlight and ambassadorships, we give Uprizers a stage to showcase their businesses, skills, and products to a wider audience.",
    features: [
      "Monthly community business feature",
      "Network reach & partner visibility",
      "Ambassadorship opportunities",
    ],
    ctaText: "Discover Our Brands",
    ctaLink: "#uprixtunity",
    imageSrc:
      "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=1200&q=80",
  },
];

export default function Products() {
  return (
    <section
      id="products"
      className="py-24 font-body bg-background text-foreground overflow-hidden"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-2xl mx-auto text-center mb-20">
          <span className="inline-block text-xs font-semibold uppercase tracking-widest text-primary-blue bg-primary-blue/10 border border-primary-blue/20 rounded-full px-4 py-1.5 mb-4">
            Uprix Products & Services
          </span>
          <h2 className="text-3xl sm:text-5xl font-extrabold font-heading tracking-tight leading-tight">
            Engineered for Action and Results.
          </h2>
          <p className="mt-4 text-base sm:text-lg text-muted-foreground leading-relaxed">
            Move past just learning and start doing. Our core programs are built
            to give you the exact frameworks, resources, and strict
            accountability you need to succeed.
          </p>
        </div>

        {/* Alternating Editorial Showcase */}
        <div className="space-y-28">
          {products.map((item, index) => {
            const isReversed = index % 2 !== 0;

            return (
              <div
                key={item.id}
                id={item.id}
                className={`scroll-mt-28 flex flex-col lg:flex-row items-center gap-12 lg:gap-16 ${
                  isReversed ? "lg:flex-row-reverse" : ""
                }`}
              >
                {/* Visual Half */}
                <div className="w-full lg:w-1/2">
                  <div className="relative aspect-[16/10] w-full rounded-2xl overflow-hidden shadow-2xl border border-border group">
                    <img
                      src={item.imageSrc}
                      alt={item.title}
                      className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
                  </div>
                </div>

                {/* Content Half */}
                <div className="w-full lg:w-1/2 space-y-6">
                  <div className="inline-flex items-center gap-2 text-xs font-semibold text-primary-blue tracking-wider uppercase">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary-blue" />
                    {item.badge}
                  </div>

                  <h3 className="text-2xl sm:text-4xl font-bold font-heading tracking-tight text-foreground">
                    {item.title}
                  </h3>

                  <p className="text-base text-muted-foreground leading-relaxed">
                    {item.description}
                  </p>

                  <ul className="space-y-3 pt-2">
                    {item.features.map((feat, i) => (
                      <li
                        key={i}
                        className="flex items-center gap-3 text-sm font-medium text-foreground"
                      >
                        <CheckCircle2 className="h-4 w-4 text-primary-blue shrink-0" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="pt-4">
                    <Link
                      href={item.ctaLink}
                      className="inline-flex items-center gap-2 rounded-xl bg-primary-blue text-white font-semibold text-sm px-6 py-3 shadow-md transition-all hover:bg-primary-blue/90 hover:gap-3"
                    >
                      <span>{item.ctaText}</span>
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}