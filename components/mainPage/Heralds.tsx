import React from "react";
import Image from "next/image";

interface HeraldMember {
  name: string;
  role: string;
  image: string;
  handle?: string;
}

const heraldsData: HeraldMember[] = [
  {
    name: "Herald One",
    role: "Community Growth & Culture",
    image: "/placeholder-avatar.png",
    
  },
  {
    name: "Herald Two",
    role: "Advocacy & Engagement",
    image: "/placeholder-avatar.png",
    
  },
  {
    name: "Herald Three",
    role: "Social & Brand Voice",
    image: "/placeholder-avatar.png",
    
  },
];

export default function Heralds() {
  return (
    <section id="heralds" className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto font-body">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-16">
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-foreground font-heading tracking-tight">
          Meet the Voices of Uprix.
        </h2>
        <p className="mt-4 text-base sm:text-lg text-muted-foreground leading-relaxed">
          The Uprix Heralds are the active, passionate members who carry the
          community&apos;s vision forward. They are the standard-bearers who help
          guide new members, spread our culture of growth, and keep the Uprix
          spirit alive across social media.
        </p>
      </div>

      {/* Grid of Heralds */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
        {heraldsData.map((herald, idx) => (
          <div
            key={idx}
            className="group relative bg-card/70 backdrop-blur-sm border border-border hover:border-primary-blue/50 rounded-2xl p-6 flex flex-col items-center text-center shadow-sm hover:shadow-lg transition-all duration-300"
          >
            {/* Avatar container */}
            <div className="relative w-28 h-28 mb-5 rounded-2xl overflow-hidden bg-primary-blue/10 border-2 border-primary-blue/20 flex items-center justify-center">
              <span className="text-primary-blue text-3xl font-extrabold font-heading">
                {herald.name.charAt(0)}
              </span>
            </div>

            <h3 className="text-xl font-bold text-card-foreground font-heading group-hover:text-primary-blue transition-colors">
              {herald.name}
            </h3>
            
            <p className="text-xs font-semibold text-primary-blue uppercase tracking-wider mt-1.5">
              {herald.role}
            </p>

            {herald.handle && (
              <span className="mt-3 text-xs text-muted-foreground font-mono">
                {herald.handle}
              </span>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}