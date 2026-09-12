/**
 * Checks if a proposed slot [start, end] with buffers conflicts with any existing booking
 */
export function hasTimeConflict(
  proposedStart: Date,
  proposedEnd: Date,
  existingBookings: { startTime: Date; endTime: Date; bufferBefore?: number; bufferAfter?: number }[],
  proposedBufferBefore: number = 0,
  proposedBufferAfter: number = 0
): boolean {
  const pStartMs = proposedStart.getTime();
  const pEndMs = proposedEnd.getTime();

  // Calculate proposed slot's total occupied time span including buffers
  const proposedOccupiedStart = pStartMs - proposedBufferBefore * 60 * 1000;
  const proposedOccupiedEnd = pEndMs + proposedBufferAfter * 60 * 1000;

  for (const booking of existingBookings) {
    const bStartMs = new Date(booking.startTime).getTime();
    const bEndMs = new Date(booking.endTime).getTime();

    const bBufferBeforeMs = (booking.bufferBefore || 0) * 60 * 1000;
    const bBufferAfterMs = (booking.bufferAfter || 0) * 60 * 1000;

    const existingOccupiedStart = bStartMs - bBufferBeforeMs;
    const existingOccupiedEnd = bEndMs + bBufferAfterMs;

    // Overlap check on total occupied time spans
    if (proposedOccupiedStart < existingOccupiedEnd && proposedOccupiedEnd > existingOccupiedStart) {
      return true;
    }
  }

  return false;
}
