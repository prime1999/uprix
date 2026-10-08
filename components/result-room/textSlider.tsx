"use client";

import { useState } from "react";

const PHRASES = [
  "Just keep going",
  "Stay consistent",
  "Don’t stop",
  "Show up every day",
  "Work harder",
  "Keep showing up",
];

// Each half repeats the list twice so it's wider than big screens.
// The track holds two identical halves, so the -50% loop is seamless.
const HALF = [...PHRASES, ...PHRASES];

function Half({ hidden = false }: { hidden?: boolean }) {
  return (
    <div className="rr-half" aria-hidden={hidden}>
      {HALF.map((p, i) => (
        <span key={i} className="rr-item">
          {p}
          <i className="rr-sep">·</i>
        </span>
      ))}
    </div>
  );
}

export default function TextSlider() {
  return (
    <div className="rr-ticker mt-12">
      <div className="rr-ticker-mask">
        <div className="rr-ticker-track">
          <Half />
          <Half hidden />
        </div>
      </div>
    </div>
  );
}
