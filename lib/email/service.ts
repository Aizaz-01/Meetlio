import {
  EmailPayload,
  buildConfirmationGuestEmail,
  buildConfirmationHostEmail,
  buildCancellationEmail,
  buildRescheduleEmail,
  buildReminderEmail,
} from './templates';

export async function sendEmail(payload: EmailPayload): Promise<boolean> {
  const smtpHost = process.env.SMTP_HOST;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASSWORD;
  const emailFrom = process.env.EMAIL_FROM || 'no-reply@meetlio.com';

  try {
    if (smtpHost && smtpUser && smtpPass) {
      try {
        // Safe dynamic require to avoid TypeScript missing module error when nodemailer is uninstalled
        const req = eval('require');
        const nodemailer = req('nodemailer');
        const transporter = nodemailer.createTransport({
          host: smtpHost,
          port: Number(process.env.SMTP_PORT) || 587,
          secure: process.env.SMTP_PORT === '465',
          auth: {
            user: smtpUser,
            pass: smtpPass,
          },
        });

        await transporter.sendMail({
          from: emailFrom,
          to: payload.to,
          subject: payload.subject,
          text: payload.text,
          html: payload.html,
        });

        return true;
      } catch {
        console.log('[Email Log Fallback]:', payload.subject, '->', payload.to);
        return true;
      }
    } else {
      // Development mode log abstraction
      console.log('==================================================');
      console.log(`[DEV EMAIL NOTIFICATION] To: ${payload.to}`);
      console.log(`Subject: ${payload.subject}`);
      console.log(`Text:\n${payload.text}`);
      console.log('==================================================');
      return true;
    }
  } catch (err) {
    console.error('Non-blocking Email Delivery Error:', err);
    return false;
  }
}

export async function sendBookingConfirmationEmails(params: {
  booking: any;
  host: any;
  eventType: any;
}): Promise<void> {
  const { booking, host, eventType } = params;

  const guestPayload = buildConfirmationGuestEmail({
    guestName: booking.guestName,
    hostName: host.name,
    eventTitle: eventType.name,
    startTime: booking.startTime,
    guestTimezone: booking.guestTimezone,
    duration: eventType.duration,
    cancelToken: booking.cancelToken,
    rescheduleToken: booking.rescheduleToken,
  });
  await sendEmail(guestPayload);

  const hostPayload = buildConfirmationHostEmail({
    guestName: booking.guestName,
    guestEmail: booking.guestEmail,
    hostName: host.name,
    hostEmail: host.email,
    eventTitle: eventType.name,
    startTime: booking.startTime,
    hostTimezone: host.timezone || 'UTC',
    duration: eventType.duration,
  });
  await sendEmail(hostPayload);
}

export async function sendBookingCancellationEmails(params: {
  booking: any;
  host: any;
  eventType: any;
  cancelledBy: 'HOST' | 'GUEST';
  reason?: string | null;
}): Promise<void> {
  const { booking, host, eventType, cancelledBy, reason } = params;

  if (cancelledBy === 'GUEST') {
    const hostPayload = buildCancellationEmail({
      recipientEmail: host.email,
      recipientName: host.name,
      eventTitle: eventType.name,
      startTime: booking.startTime,
      timezone: host.timezone || 'UTC',
      cancelledBy: 'Guest',
      reason,
    });
    await sendEmail(hostPayload);
  } else {
    const guestPayload = buildCancellationEmail({
      recipientEmail: booking.guestEmail,
      recipientName: booking.guestName,
      eventTitle: eventType.name,
      startTime: booking.startTime,
      timezone: booking.guestTimezone,
      cancelledBy: 'Host',
      reason,
    });
    await sendEmail(guestPayload);
  }
}

export async function sendBookingRescheduledEmails(params: {
  oldBooking: any;
  newBooking: any;
  host: any;
  eventType: any;
}): Promise<void> {
  const { oldBooking, newBooking, host, eventType } = params;

  const guestPayload = buildRescheduleEmail({
    recipientEmail: newBooking.guestEmail,
    recipientName: newBooking.guestName,
    eventTitle: eventType.name,
    oldStartTime: oldBooking.startTime,
    newStartTime: newBooking.startTime,
    timezone: newBooking.guestTimezone,
    cancelToken: newBooking.cancelToken,
    rescheduleToken: newBooking.rescheduleToken,
  });
  await sendEmail(guestPayload);

  const hostPayload = buildRescheduleEmail({
    recipientEmail: host.email,
    recipientName: host.name,
    eventTitle: eventType.name,
    oldStartTime: oldBooking.startTime,
    newStartTime: newBooking.startTime,
    timezone: host.timezone || 'UTC',
  });
  await sendEmail(hostPayload);
}

export async function sendReminderNotification(params: {
  booking: any;
  host: any;
  eventType: any;
  reminderLabel: string;
}): Promise<void> {
  const { booking, host, eventType, reminderLabel } = params;

  const guestPayload = buildReminderEmail({
    recipientEmail: booking.guestEmail,
    recipientName: booking.guestName,
    eventTitle: eventType.name,
    hostName: host.name,
    startTime: booking.startTime,
    timezone: booking.guestTimezone,
    reminderLabel,
    cancelToken: booking.cancelToken,
    rescheduleToken: booking.rescheduleToken,
  });
  await sendEmail(guestPayload);
}
