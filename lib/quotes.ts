export interface Quote {
  id: string;
  quote: string;
  author: string;
  category: "execution" | "environment" | "consistency" | "mindset" | "growth";
  tag: string;
}

export interface QuoteGeneratorOptions {
  category?: Quote["category"];
  excludeIds?: string[];
}

const PRODUCTIVITY_QUOTES: Quote[] = [
  {
    id: "prod-1",
    quote: "Growth demands the right environment.",
    author: "Result Room",
    category: "environment",
    tag: "Atmosphere",
  },
  {
    id: "prod-2",
    quote:
      "You don't rise to the level of your goals, you fall to the level of your systems.",
    author: "James Clear",
    category: "consistency",
    tag: "Systems",
  },
  {
    id: "prod-3",
    quote:
      "Amateurs sit and wait for inspiration, the rest of us just get up and go to work.",
    author: "Stephen King",
    category: "execution",
    tag: "Action",
  },
  {
    id: "prod-4",
    quote: "Focus is a matter of deciding what things you're not going to do.",
    author: "John Carmack",
    category: "mindset",
    tag: "Focus",
  },
  {
    id: "prod-5",
    quote: "Long-term consistency trumps short-term intensity.",
    author: "Bruce Lee",
    category: "consistency",
    tag: "Habits",
  },
  {
    id: "prod-6",
    quote: "Ship early, ship often. Execution validates ideas, not thoughts.",
    author: "Anonymous",
    category: "execution",
    tag: "Shipping",
  },
  {
    id: "prod-7",
    quote: "Surround yourself with people who hold you to a higher standard.",
    author: "Naval Ravikant",
    category: "environment",
    tag: "Accountability",
  },
  {
    id: "prod-8",
    quote: "Small daily improvements over time lead to stunning results.",
    author: "Robin Sharma",
    category: "growth",
    tag: "Compounding",
  },
];

/**
 * Generates a random productivity/growth quote with optional category filtering.
 */
export function getRandomQuote(options: QuoteGeneratorOptions = {}): Quote {
  const { category, excludeIds = [] } = options;

  let pool = PRODUCTIVITY_QUOTES.filter((q) => !excludeIds.includes(q.id));

  if (category) {
    pool = pool.filter((q) => q.category === category);
  }

  // Fallback if all quotes in category were excluded
  if (pool.length === 0) {
    pool = category
      ? PRODUCTIVITY_QUOTES.filter((q) => q.category === category)
      : PRODUCTIVITY_QUOTES;
  }

  const randomIndex = Math.floor(Math.random() * pool.length);
  return pool[randomIndex];
}

/**
 * Generates an array of unique quotes for batch rendering (e.g., daily streaks or cards).
 */
export function getQuoteBatch(
  count: number,
  category?: Quote["category"],
): Quote[] {
  const result: Quote[] = [];
  const excluded: string[] = [];

  for (let i = 0; i < count; i++) {
    const quote = getRandomQuote({ category, excludeIds: excluded });
    result.push(quote);
    excluded.push(quote.id);
  }

  return result;
}
