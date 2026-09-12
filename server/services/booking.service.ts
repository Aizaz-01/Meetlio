import { bookingRepository } from '../repositories/booking.repository';

export const bookingService = {
  async getUserBookings(userId: string) {
    return bookingRepository.findByUserId(userId);
  },

  async getBookingDetails(bookingId: string) {
    return bookingRepository.findById(bookingId);
  },
};
