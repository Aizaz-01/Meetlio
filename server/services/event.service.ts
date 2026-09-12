import { eventRepository } from '../repositories/event.repository';
import { CreateEventTypeInput, UpdateEventTypeInput } from '@/lib/validation/event.schema';

export const eventService = {
  async getUserEvents(userId: string) {
    return eventRepository.findByUserId(userId);
  },

  async getEventBySlug(userId: string, slug: string) {
    return eventRepository.findByUserAndSlug(userId, slug);
  },
};
