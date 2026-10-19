/** Source-independent math for touch pinches and trackpad zoom.
 * UI handlers must prevent the browser's page zoom only while two fingers
 * are on an individual book surface; one-finger scroll remains native.
 */
export type TouchPoint = { clientX: number; clientY: number };
export type PinchSnapshot = { distance: number; zoom: number };

export function twoFingerDistance(points: ArrayLike<TouchPoint>): number {
  if (points.length !== 2) return 0;
  const dx = points[0].clientX - points[1].clientX;
  const dy = points[0].clientY - points[1].clientY;
  return Math.hypot(dx, dy);
}

export function boundedBookZoom(value: number, minimum = 1, maximum = 4): number {
  if (!Number.isFinite(value)) return minimum;
  return Math.min(maximum, Math.max(minimum, Math.round(value * 100) / 100));
}

export function zoomFromPinch(snapshot: PinchSnapshot, points: ArrayLike<TouchPoint>,
  minimum = 1, maximum = 4): number {
  if (!snapshot || snapshot.distance <= 0) return boundedBookZoom(snapshot?.zoom ?? minimum, minimum, maximum);
  const currentDistance = twoFingerDistance(points);
  if (!currentDistance) return boundedBookZoom(snapshot.zoom, minimum, maximum);
  return boundedBookZoom(snapshot.zoom * currentDistance / snapshot.distance, minimum, maximum);
}

export function zoomFromWheel(current: number, deltaY: number, minimum = 1, maximum = 4): number {
  return boundedBookZoom(current * Math.exp(-deltaY * 0.005), minimum, maximum);
}
