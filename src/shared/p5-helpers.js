// Shared responsive canvas helper for p5 sketches
// Usage: import { responsiveCanvas } from '/src/shared/p5-helpers.js';
// In setup: responsiveCanvas(p, 600, 420, 'p5canvas');
// In draw: use p.width and p.height instead of hardcoded numbers

export function responsiveCanvas(p, maxW, maxH, parentId) {
  const w = Math.min(maxW, p.windowWidth - 80);
  const h = Math.min(maxH, (w / maxW) * maxH);
  const c = p.createCanvas(w, h);
  if (parentId) c.parent(parentId);
  return c;
}
