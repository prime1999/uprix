export const getGreeting = (date: Date = new Date()): string => {
  const hour = date.getHours();

  if (hour >= 5 && hour < 12) {
    return "Good morning";
  } else if (hour >= 12 && hour < 17) {
    return "Good afternoon";
  } else if (hour >= 17 && hour < 22) {
    return "Good evening";
  } else {
    return "Good night"; // 10 PM to 5 AM fallback
  }
};

export const formatDateWithOrdinal = (date: Date = new Date()): string => {
  const day = date.getDate();
  const month = date.toLocaleString("en-US", { month: "long" });
  const year = date.getFullYear();

  // Determine ordinal suffix (st, nd, rd, th)
  const getOrdinalSuffix = (n: number): string => {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return s[(v - 20) % 10] || s[v] || s[0];
  };

  return `${day}${getOrdinalSuffix(day)}, ${month} ${year}`;
};
