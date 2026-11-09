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
  {
    id: "prod-9",
    quote: "Work while your bones are strong, rest while your bones are weak.",
    author: "Taifaq",
    category: "execution",
    tag: "Urgency",
  },
  {
    id: "prod-10",
    quote: "Amateurs call it genius, masters call it practice.",
    author: "Cräcky Bröwn",
    category: "growth",
    tag: "Practice",
  },
  {
    id: "prod-11",
    quote:
      "What you know you'll eventually do, it makes no sense doing it later. Do it now.",
    author: "Taifaq",
    category: "execution",
    tag: "Now",
  },
  {
    id: "prod-12",
    quote: "It always seems impossible until it's done.",
    author: "Nelson Mandela",
    category: "mindset",
    tag: "Persistence",
  },
  {
    id: "prod-13",
    quote:
      "If you spend too much time thinking about a thing, you'll never get it done.",
    author: "Bruce Lee",
    category: "execution",
    tag: "Overthinking",
  },
  {
    id: "prod-14",
    quote: "Don't watch the clock; do what it does. Keep going.",
    author: "Sam Levenson",
    category: "consistency",
    tag: "Keep going",
  },
  {
    id: "prod-15",
    quote: "There is no substitute for hard work.",
    author: "Thomas Edison",
    category: "consistency",
    tag: "Effort",
  },
  {
    id: "prod-16",
    quote:
      "We must all suffer one of two things: the pain of discipline or the pain of regret.",
    author: "Jim Rohn",
    category: "mindset",
    tag: "Discipline",
  },
  {
    id: "prod-17",
    quote: "Whether you think you can, or you think you can't, you're right.",
    author: "Henry Ford",
    category: "mindset",
    tag: "Belief",
  },
];

/**
 * Returns all available quotes after applying filters.
 * Unlike getRandomQuote, this never reintroduces excluded quotes.
 */
export function getAvailableQuotes(
  options: QuoteGeneratorOptions = {},
): Quote[] {
  const { category, excludeIds = [] } = options;

  return PRODUCTIVITY_QUOTES.filter((quote) => {
    const matchesCategory = !category || quote.category === category;
    const notExcluded = !excludeIds.includes(quote.id);

    return matchesCategory && notExcluded;
  });
}

/**
 * Returns one random quote.
 * If every quote has been excluded, starts from the full matching pool.
 */
export function getRandomQuote(options: QuoteGeneratorOptions = {}): Quote {
  const { category } = options;

  let pool = getAvailableQuotes(options);

  if (pool.length === 0) {
    pool = PRODUCTIVITY_QUOTES.filter(
      (quote) => !category || quote.category === category,
    );
  }

  if (pool.length === 0) {
    throw new Error("No quotes available.");
  }

  const randomIndex = Math.floor(Math.random() * pool.length);

  return pool[randomIndex];
}

/**
 * Returns a batch of unique quotes.
 * If count exceeds the available quotes, returns all available quotes.
 */
export function getQuoteBatch(
  count: number,
  category?: Quote["category"],
): Quote[] {
  if (count <= 0) return [];

  const pool = getAvailableQuotes({ category });

  // Fisher-Yates shuffle
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  return pool.slice(0, count);
}
