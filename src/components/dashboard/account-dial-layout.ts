type Point = { x: number; y: number };

/** Preserve the original compact curve and translate the whole dial away from viewport edges. */
export function getAccountDialLayout(
  origin: Point,
  viewport: { width: number; height: number },
  count: number,
) {
  const radius = 88;
  const margin = 12;
  const extent = 28; // Includes hover scale and the focus ring.
  const points = Array.from({ length: count }, (_, index) => {
    const angle =
      ((-140 + (170 * index) / Math.max(1, count - 1)) * Math.PI) / 180;
    return { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius };
  });
  const minX = Math.min(0, ...points.map((point) => point.x)) - extent;
  const maxX = Math.max(0, ...points.map((point) => point.x)) + extent;
  const minY = Math.min(0, ...points.map((point) => point.y)) - extent;
  const maxY = Math.max(0, ...points.map((point) => point.y)) + extent;
  return {
    origin: {
      x: Math.max(
        margin - minX,
        Math.min(origin.x, viewport.width - margin - maxX),
      ),
      y: Math.max(
        margin - minY,
        Math.min(origin.y, viewport.height - margin - maxY),
      ),
    },
    points,
  };
}
