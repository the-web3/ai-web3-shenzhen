/**
 * Format price from basis points (0-10000) to percentage string
 */
export function formatPrice(price: number): string {
  return `${(price / 100).toFixed(2)}%`;
}

/**
 * Alias for formatPrice - formats basis points as percentage
 */
export function formatPriceAsPercent(price: number): string {
  return formatPrice(price);
}

/**
 * Format price from basis points to decimal (0-1)
 */
export function priceToDecimal(price: number): number {
  return price / 10000;
}

/**
 * Convert decimal price (0-1) to basis points
 */
export function decimalToPrice(decimal: number): number {
  return Math.round(decimal * 10000);
}

/**
 * Format address for display (0x1234...5678)
 */
export function formatAddress(address: string, chars = 4): string {
  if (!address) return "";
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

/**
 * Format large numbers with commas
 */
export function formatNumber(num: number | string, decimals = 2): string {
  const n = typeof num === "string" ? parseFloat(num) : num;
  return n.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Format token amount for display
 * Handles both wei format (bigint/large integer strings) and decimal format (regular numbers)
 */
export function formatTokenAmount(amount: string | bigint | number, decimals = 18, displayDecimals = 2): string {
  // Handle bigint directly
  if (typeof amount === "bigint") {
    const divisor = BigInt(10 ** decimals);
    const whole = amount / divisor;
    const fraction = amount % divisor;
    const fractionStr = fraction.toString().padStart(decimals, "0").slice(0, displayDecimals);
    return `${whole.toLocaleString()}.${fractionStr}`;
  }

  // Handle number directly
  if (typeof amount === "number") {
    return amount.toLocaleString("en-US", {
      minimumFractionDigits: displayDecimals,
      maximumFractionDigits: displayDecimals,
    });
  }

  // Handle string - detect if it's wei format or decimal format
  const str = amount.toString();

  // If it contains a decimal point or is a reasonable number, treat as decimal
  if (str.includes(".") || (str.length < 15 && !str.startsWith("0x"))) {
    const n = parseFloat(str);
    if (isNaN(n)) return "0.00";
    return n.toLocaleString("en-US", {
      minimumFractionDigits: displayDecimals,
      maximumFractionDigits: displayDecimals,
    });
  }

  // Otherwise treat as wei format (large integer string)
  try {
    const n = BigInt(str);
    const divisor = BigInt(10 ** decimals);
    const whole = n / divisor;
    const fraction = n % divisor;
    const fractionStr = fraction.toString().padStart(decimals, "0").slice(0, displayDecimals);
    return `${whole.toLocaleString()}.${fractionStr}`;
  } catch {
    // Fallback for invalid input
    return "0.00";
  }
}

/**
 * Parse token amount (from display to wei)
 */
export function parseTokenAmount(amount: string, decimals = 18): bigint {
  const [whole, fraction = ""] = amount.split(".");
  const paddedFraction = fraction.padEnd(decimals, "0").slice(0, decimals);
  return BigInt(whole + paddedFraction);
}

/**
 * Format relative time
 */
export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diff = d.getTime() - now.getTime();

  const absDiff = Math.abs(diff);
  const isPast = diff < 0;

  const minutes = Math.floor(absDiff / (1000 * 60));
  const hours = Math.floor(absDiff / (1000 * 60 * 60));
  const days = Math.floor(absDiff / (1000 * 60 * 60 * 24));

  let timeStr: string;
  if (days > 0) {
    timeStr = `${days} day${days > 1 ? "s" : ""}`;
  } else if (hours > 0) {
    timeStr = `${hours} hour${hours > 1 ? "s" : ""}`;
  } else {
    timeStr = `${minutes} minute${minutes > 1 ? "s" : ""}`;
  }

  return isPast ? `${timeStr} ago` : `in ${timeStr}`;
}

/**
 * Alias for formatRelativeTime - used for deadlines
 */
export function formatDeadline(date: Date | string): string {
  return formatRelativeTime(date);
}

/**
 * Generate random invite code
 */
export function generateInviteCode(length = 8): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Normalize address to lowercase
 */
export function normalizeAddress(address: string): string {
  return address.toLowerCase();
}
