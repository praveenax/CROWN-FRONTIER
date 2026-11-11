export const key = (x, y) => `${x},${y}`;
export const distance = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
export const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
