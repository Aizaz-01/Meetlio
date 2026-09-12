const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Meetlio database seed...');

  const passwordHash = await bcrypt.hash('meetlio123', 10);

  // 1. Find existing user by email or username
  let demoUser = await prisma.user.findFirst({
    where: {
      OR: [
        { email: 'alex@meetlio.com' },
        { username: 'alexsmith' },
      ],
    },
  });

  if (demoUser) {
    demoUser = await prisma.user.update({
      where: { id: demoUser.id },
      data: {
        name: 'Alex Smith',
        email: 'alex@meetlio.com',
        username: 'alexsmith',
        passwordHash,
        onboardingCompleted: true,
      },
    });
  } else {
    demoUser = await prisma.user.create({
      data: {
        name: 'Alex Smith',
        email: 'alex@meetlio.com',
        username: 'alexsmith',
        passwordHash,
        timezone: 'UTC',
        onboardingCompleted: true,
        bio: 'Product Strategist & SaaS Advisor. Book a 1:1 strategy session with me.',
      },
    });
  }

  console.log('✅ Demo User seeded: alex@meetlio.com / meetlio123');

  // 2. Create Default Availability Schedule
  let schedule = await prisma.availabilitySchedule.findFirst({
    where: { userId: demoUser.id },
  });

  if (!schedule) {
    schedule = await prisma.availabilitySchedule.create({
      data: {
        userId: demoUser.id,
        name: 'Working Hours',
        isDefault: true,
        timezone: 'UTC',
        availabilities: {
          create: [1, 2, 3, 4, 5].map((day) => ({
            userId: demoUser.id,
            dayOfWeek: day,
            startTime: '09:00',
            endTime: '17:00',
            isActive: true,
          })),
        },
      },
    });
  }

  console.log('✅ Availability Schedule seeded');

  // 3. Create Event Types
  const event1 = await prisma.eventType.upsert({
    where: { userId_slug: { userId: demoUser.id, slug: '30min-meeting' } },
    update: {},
    create: {
      userId: demoUser.id,
      name: '30 Minute Strategy Session',
      title: '30 Minute Strategy Session',
      slug: '30min-meeting',
      description: 'Quick 1:1 alignment call to review product roadmap and strategy.',
      duration: 30,
      color: '#3b82f6',
      kind: 'ONE_ON_ONE',
      eventKind: 'ONE_ON_ONE',
      locationType: 'GOOGLE_MEET',
      locationInfo: 'Google Meet Video Call',
      scheduleId: schedule.id,
      isActive: true,
      active: true,
      bufferBefore: 5,
      bufferAfter: 10,
      minimumNotice: 120,
      maximumBookingWindow: 60,
    },
  });

  const event2 = await prisma.eventType.upsert({
    where: { userId_slug: { userId: demoUser.id, slug: '15min-sync' } },
    update: {},
    create: {
      userId: demoUser.id,
      name: '15 Minute Quick Sync',
      title: '15 Minute Quick Sync',
      slug: '15min-sync',
      description: 'Brief check-in call for quick questions or status updates.',
      duration: 15,
      color: '#10b981',
      kind: 'ONE_ON_ONE',
      eventKind: 'ONE_ON_ONE',
      locationType: 'GOOGLE_MEET',
      locationInfo: 'Google Meet Video Call',
      scheduleId: schedule.id,
      isActive: true,
      active: true,
      bufferBefore: 0,
      bufferAfter: 5,
    },
  });

  const event3 = await prisma.eventType.upsert({
    where: { userId_slug: { userId: demoUser.id, slug: '60min-consultation' } },
    update: {},
    create: {
      userId: demoUser.id,
      name: '60 Minute Deep-Dive Consultation',
      title: '60 Minute Deep-Dive Consultation',
      slug: '60min-consultation',
      description: 'In-depth strategic consulting session.',
      duration: 60,
      color: '#6366f1',
      kind: 'ONE_ON_ONE',
      eventKind: 'ONE_ON_ONE',
      locationType: 'GOOGLE_MEET',
      locationInfo: 'Google Meet Video Call',
      scheduleId: schedule.id,
      isActive: true,
      active: true,
    },
  });

  console.log('✅ Event Types seeded (30min, 15min, 60min)');

  // 4. Create Sample Contacts
  const contact1 = await prisma.contact.upsert({
    where: { userId_email: { userId: demoUser.id, email: 'sarah.j@acme.com' } },
    update: {},
    create: {
      userId: demoUser.id,
      name: 'Sarah Jenkins',
      email: 'sarah.j@acme.com',
      company: 'Acme Enterprises',
      jobTitle: 'VP Product',
      notes: 'Interested in enterprise seat expansion.',
    },
  });

  const contact2 = await prisma.contact.upsert({
    where: { userId_email: { userId: demoUser.id, email: 'michael.b@techcorp.io' } },
    update: {},
    create: {
      userId: demoUser.id,
      name: 'Michael Brown',
      email: 'michael.b@techcorp.io',
      company: 'TechCorp IO',
      jobTitle: 'Head of Engineering',
      notes: 'Asked about API webhook integration.',
    },
  });

  console.log('✅ Sample Contacts seeded');

  // 5. Create Sample Bookings
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(10, 0, 0, 0);
  const tomorrowEnd = new Date(tomorrow.getTime() + 30 * 60 * 1000);

  const existingBooking = await prisma.booking.findFirst({
    where: { userId: demoUser.id, guestEmail: 'sarah.j@acme.com' },
  });

  if (!existingBooking) {
    await prisma.booking.create({
      data: {
        userId: demoUser.id,
        eventTypeId: event1.id,
        guestName: 'Sarah Jenkins',
        inviteeName: 'Sarah Jenkins',
        guestEmail: 'sarah.j@acme.com',
        inviteeEmail: 'sarah.j@acme.com',
        guestTimezone: 'America/New_York',
        timezone: 'America/New_York',
        startTime: tomorrow,
        endTime: tomorrowEnd,
        status: 'CONFIRMED',
        location: 'Google Meet Video Call',
        cancelToken: 'demo_cancel_token_1',
        rescheduleToken: 'demo_reschedule_token_1',
      },
    });
  }

  console.log('✅ Sample Bookings seeded');

  // 6. Create Workflows
  const existingWf = await prisma.workflow.findFirst({
    where: { userId: demoUser.id, name: 'Standard Confirmation & 24h Reminder' },
  });

  if (!existingWf) {
    await prisma.workflow.create({
      data: {
        userId: demoUser.id,
        name: 'Standard Confirmation & 24h Reminder',
        trigger: 'booking.created',
        active: true,
        isActive: true,
        actions: {
          create: [
            { actionType: 'EMAIL', type: 'SEND_EMAIL', timing: 'IMMEDIATE', order: 0 },
            { actionType: 'EMAIL', type: 'SEND_REMINDER', timing: 'BEFORE_MEETING', order: 1 },
          ],
        },
      },
    });
  }

  console.log('✅ Workflows seeded');
  console.log('🎉 Meetlio seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
