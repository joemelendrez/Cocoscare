// A small per-instance, per-IP fixed window: enough to stop one person or
// bot hammering a public form. Each caller keeps its own Map.
export function ipLimiter({ windowMs, max }) {
  const hits = new Map();
  return (ip) => {
    const now = Date.now();
    const recent = (hits.get(ip) || []).filter((t) => now - t < windowMs);
    recent.push(now);
    hits.set(ip, recent);
    if (hits.size > 5000) hits.clear();
    return recent.length > max;
  };
}

export const clientIp = (request) =>
  request.headers.get("x-nf-client-connection-ip") || request.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";

export const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
