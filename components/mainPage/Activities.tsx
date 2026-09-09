"use client";

import Image from "next/image";
import { Target, Users, Search, ArrowUpRight, Sparkles } from "lucide-react";
import clock from "@/app/assets/images/clock.png";
import bg from "@/app/assets/images/bg.png";
import pad from "@/app/assets/images/pad.png";
import deep from "@/app/assets/images/deep.png";
import deepBg from "@/app/assets/images/deepBg.png";

export default function Activities() {
  return (
    <section className="w-11/12 md:w-9/12 lg:w-7/12 mx-auto p-6 mt-36 mb-8 min-h-screen flex items-center justify-center font-sans">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 w-full">
        {/* Card 1: Targeted Campaigns (Full Width Header Card) */}
        <div
          style={{ backgroundImage: `url(${bg.src})` }}
          className="bg-cover bg-center md:col-span-12 relative overflow-visible rounded-3xl p-8 border border-slate-200/80 shadow-sm hover:shadow-md transition-all duration-300 group"
        >
          {/* Subtle Yellow Gradient Accent */}
          {/* <div className="absolute -right-12 -top-12 w-48 h-48 bg-primary-yellow rounded-full blur-3xl pointer-events-none transition-colors" /> */}

          <div className="z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 overflow-visible">
            <div className="max-w-lg z-50 text-secondary-blue">
              <h2 className="text-3xl font-bold tracking-tight mb-4">
                Daily Affirmation
              </h2>
              <p className="text-slate-600 text-sm/5 md:text-base/5">
                Start every morning with clarity. We share positive words and
                focused thoughts each day to help you build a winning mindset
                and stay intentional about your goals
              </p>
            </div>
            <Image
              src={clock}
              alt="clock image"
              width={400}
              height={400}
              className="absolute -top-30 -right-20 translate-x-2 -mr-24"
            />
          </div>
        </div>

        {/* Card 2: Social Media Management */}
        <div
          style={{ backgroundImage: `url(${deepBg.src})` }}
          className="bg-cover bg-center md:col-span-5 relative overflow-hidden bg-white rounded-3xl p-2 border border-slate-200/80 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between group"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-100/60 rounded-full blur-2xl pointer-events-none" />

          <Image
            src={deep}
            alt="Deep Image"
            width={200}
            height={200}
            className="absolute -left-10 -bottom-12 -mb-4"
          />
          <div className="relative z-50 bg-[rgba(255,255,255,0.90)] rounded-2xl p-4">
            <p className="text-slate-600 text-sm/5">
              Once a month, we go below the surface. X-Deep is a free,
              high-impact virtual session where we invite experts to teach on
              deep topics like purpose discovery, execution, and career growth.
            </p>
          </div>
        </div>

        {/* Card 3: SEO & Content Marketing */}
        <div className="relative md:col-span-7 relative overflow-hidden bg-gradient-to-br from-secondary-blue via-blue-600 to-primary-blue text-white rounded-3xl p-8 shadow-md hover:shadow-lg transition-all duration-300 flex flex-col justify-between group">
          {/* Yellow Decorative Glow */}
          <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-yellow-400/20 rounded-full blur-2xl pointer-events-none" />

          <div className="relative mt-24 z-10">
            <h3 className="text-2xl font-bold mb-3 text-white">
              Uprix Game Night
            </h3>
            <p className="text-blue-100 text-sm/5 max-w-md">
              Hard work deserves good fun. Twice a month (on the 2nd and last
              Sunday), we take a break to unwind. Join us to play exciting
              games, win cash prizes, and bond with fellow Uprizers in a
              relaxed, stress-free space.
            </p>
          </div>
          <Image
            src={pad}
            alt="Pad"
            width={400}
            height={400}
            className="absolute -top-20 -right-10"
          />

          <div className="relative z-10 mt-8 pt-6 border-t border-white/10 flex items-center justify-between text-xs text-blue-200"></div>
        </div>
      </div>
    </section>
  );
}
