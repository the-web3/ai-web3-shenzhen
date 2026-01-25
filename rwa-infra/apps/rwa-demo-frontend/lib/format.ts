export function shortAddr(addr?: string) {
  if (!addr) return "-";
  if (addr.length < 12) return addr;
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export function shortHash(h?: string) {
  if (!h) return "-";
  if (h.length < 14) return h;
  return `${h.slice(0, 10)}…${h.slice(-6)}`;
}

export function asString(v: unknown) {
  if (v === null || v === undefined) return "-";
  if (typeof v === "bigint") return v.toString();
  return String(v);
}

