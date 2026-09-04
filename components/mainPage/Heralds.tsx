import React from "react";

export default function Heralds() {
  return (
    <section id="heralds" className="relative w-full overflow-hidden py-16 sm:py-24 font-body">
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Parallax Container */}
        <div className="relative rounded-3xl overflow-hidden shadow-xl border border-border p-4 sm:p-10 flex items-center justify-start min-h-[480px]">
          
          {/* Parallax Background: People, unity, and growth */}
          <div 
            className="absolute inset-0 bg-fixed bg-center bg-cover -z-10"
            style={{
              backgroundImage: `url('https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1800&q=80)'`,
            }}
          >
            {/* Dark contrast gradient */}
            <div className="absolute inset-0 bg-black/40" />
          </div>

          {/* Frosted Content Card */}
          <div className="relative z-10 py-10 px-6 sm:px-10 max-w-xl bg-white/90 dark:bg-slate-950/90 backdrop-blur-md rounded-2xl border border-white/60 dark:border-white/10 shadow-2xl">
            <span className="inline-block text-xs font-semibold text-primary-blue uppercase tracking-widest bg-primary-blue/10 border border-primary-blue/20 rounded-full px-3.5 py-1 mb-4">
              Uprix Community
            </span>
            
            <h2 className="text-2xl sm:text-4xl font-extrabold text-foreground font-heading tracking-tight leading-tight">
              Meet the Voices of Uprix.
            </h2>
            
            <p className="mt-4 text-sm sm:text-base text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
              The Uprix Heralds are the active, passionate collective carrying the
              community&apos;s vision forward. Serving as standard-bearers across networks,
              they guide newcomers, embody our culture of continuous growth, and elevate
              the Uprix narrative across every space.
            </p>

            <div className="mt-6 flex items-center gap-3 text-xs sm:text-sm font-semibold text-primary-blue">
              <span className="h-0.5 w-6 sm:w-8 bg-primary-blue" />
              <span>Advocates &bull; Culture Builders &bull; Standard-Bearers</span>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}