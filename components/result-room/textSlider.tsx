const PHRASES = [
  "Just keep going",
  "Stay consistent",
  "Don’t stop",
  "Show up every day",
  "Work harder",
  "Keep showing up",
];

// Each half repeats the list so it's wider than big screens.
// A track holds two identical halves, so the -50% loop is seamless.
const repeat = (list: string[]) => [...list, ...list];

function Half({
  items,
  hidden = false,
}: {
  items: string[];
  hidden?: boolean;
}) {
  return (
    <div className="rr-half" aria-hidden={hidden}>
      {items.map((p, i) => (
        <span
          key={i}
          className="rr-item font-bricolage text-3xl md:text-xl lg:text-lg"
        >
          {p}
          <i className="rr-sep">·</i>
        </span>
      ))}
    </div>
  );
}

function Row({
  phrases,
  reverse = false,
  duration = 46,
  decorative = false,
}: {
  phrases: string[];
  reverse?: boolean;
  /** seconds for one full loop */
  duration?: number;
  /** hide from screen readers (use for the duplicate row) */
  decorative?: boolean;
}) {
  const items = repeat(phrases);

  return (
    <div className="rr-ticker-mask" aria-hidden={decorative}>
      <div
        className={`rr-ticker-track ${reverse ? "rr-ticker-track--reverse" : ""}`}
        style={{ animationDuration: `${duration}s` }}
      >
        <Half items={items} />
        <Half items={items} hidden />
      </div>
    </div>
  );
}

export default function TextSlider() {
  return (
    <div className="rr-ticker mt-12">
      {/* goes left */}
      <Row phrases={PHRASES} />
      {/* goes right, reversed order and a slightly different speed */}
      <Row phrases={[...PHRASES].reverse()} reverse duration={54} decorative />
    </div>
  );
}
