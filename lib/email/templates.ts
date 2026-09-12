import { formatTimeInZone } from '@/lib/scheduling/timezone';

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export function buildConfirmationGuestEmail(params: {
  guestName: string;
  hostName: string;
  eventTitle: string;
  startTime: Date;
  guestTimezone: string;
  duration: number;
  cancelToken?: string | null;
  rescheduleToken?: string | null;
  baseUrl?: string;
}): EmailPayload {
  const { guestName, hostName, eventTitle, startTime, guestTimezone, duration, cancelToken, rescheduleToken, baseUrl = 'http://localhost:3000' } = params;
  const formattedTime = formatTimeInZone(startTime, guestTimezone, 'EEEE, MMMM d, yyyy @ hh:mm a');

  const cancelUrl = cancelToken ? `${baseUrl}/cancel/${cancelToken}` : `${baseUrl}`;
  const rescheduleUrl = rescheduleToken ? `${baseUrl}/reschedule/${rescheduleToken}` : `${baseUrl}`;
  const calendarUrl = cancelToken ? `${baseUrl}/api/public/bookings/${cancelToken}/calendar` : `${baseUrl}`;

  const subject = `Booking Confirmed: ${eventTitle} with ${hostName}`;
  const text = `Hi ${guestName},\n\nYour meeting "${eventTitle}" with ${hostName} is confirmed for ${formattedTime} (${guestTimezone}).\nDuration: ${duration} minutes.\n\nCalendar Invite (.ics): ${calendarUrl}\nReschedule Link: ${rescheduleUrl}\nCancel Link: ${cancelUrl}\n\nThank you,\nMeetlio`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded-radius: 12px;">
      <h2 style="color: #4f46e5; margin-bottom: 4px;">Booking Confirmed!</h2>
      <p style="color: #64748b; font-size: 14px;">Hi <strong>${guestName}</strong>, your meeting has been successfully scheduled.</p>
      
      <div style="background-color: #f8fafc; padding: 16px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4f46e5;">
        <h3 style="margin: 0 0 8px 0; color: #0f172a;">${eventTitle}</h3>
        <p style="margin: 4px 0; color: #334155; font-size: 14px;"><strong>Date & Time:</strong> ${formattedTime} (${guestTimezone})</p>
        <p style="margin: 4px 0; color: #334155; font-size: 14px;"><strong>Duration:</strong> ${duration} minutes</p>
        <p style="margin: 4px 0; color: #334155; font-size: 14px;"><strong>Host:</strong> ${hostName}</p>
      </div>

      <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 13px;">
        <p style="margin-bottom: 8px;"><strong>Need to make changes?</strong></p>
        <a href="${calendarUrl}" style="display: inline-block; background-color: #4f46e5; color: white; padding: 8px 16px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-right: 8px;">Add to Calendar (.ics)</a>
        <a href="${rescheduleUrl}" style="color: #4f46e5; margin-right: 12px;">Reschedule</a>
        <a href="${cancelUrl}" style="color: #ef4444;">Cancel Meeting</a>
      </div>
    </div>
  `;

  return { to: params.guestName, subject, html, text };
}

export function buildConfirmationHostEmail(params: {
  guestName: string;
  guestEmail: string;
  hostName: string;
  hostEmail: string;
  eventTitle: string;
  startTime: Date;
  hostTimezone: string;
  duration: number;
}): EmailPayload {
  const { guestName, guestEmail, hostEmail, eventTitle, startTime, hostTimezone, duration } = params;
  const formattedTime = formatTimeInZone(startTime, hostTimezone, 'EEEE, MMMM d, yyyy @ hh:mm a');

  const subject = `New Booking: ${eventTitle} with ${guestName}`;
  const text = `Hi ${params.hostName},\n\nYou have a new booking "${eventTitle}" with ${guestName} (${guestEmail}) scheduled for ${formattedTime} (${hostTimezone}).\nDuration: ${duration} minutes.`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
      <h2 style="color: #4f46e5; margin-bottom: 4px;">New Client Booking</h2>
      <p style="color: #64748b; font-size: 14px;">A new meeting has been added to your Meetlio schedule.</p>
      
      <div style="background-color: #f8fafc; padding: 16px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
        <h3 style="margin: 0 0 8px 0; color: #0f172a;">${eventTitle}</h3>
        <p style="margin: 4px 0; color: #334155; font-size: 14px;"><strong>Client:</strong> ${guestName} (${guestEmail})</p>
        <p style="margin: 4px 0; color: #334155; font-size: 14px;"><strong>Date & Time:</strong> ${formattedTime} (${hostTimezone})</p>
        <p style="margin: 4px 0; color: #334155; font-size: 14px;"><strong>Duration:</strong> ${duration} minutes</p>
      </div>
    </div>
  `;

  return { to: hostEmail, subject, html, text };
}

export function buildCancellationEmail(params: {
  recipientEmail: string;
  recipientName: string;
  eventTitle: string;
  startTime: Date;
  timezone: string;
  cancelledBy: string;
  reason?: string | null;
}): EmailPayload {
  const { recipientEmail, recipientName, eventTitle, startTime, timezone, cancelledBy, reason } = params;
  const formattedTime = formatTimeInZone(startTime, timezone, 'EEEE, MMMM d, yyyy @ hh:mm a');

  const subject = `Booking Cancelled: ${eventTitle}`;
  const text = `Hi ${recipientName},\n\nThe meeting "${eventTitle}" scheduled for ${formattedTime} (${timezone}) has been cancelled by the ${cancelledBy.toLowerCase()}.\n${reason ? `Reason: ${reason}\n` : ''}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
      <h2 style="color: #ef4444; margin-bottom: 4px;">Meeting Cancelled</h2>
      <p style="color: #64748b; font-size: 14px;">Hi <strong>${recipientName}</strong>, the following meeting was cancelled by ${cancelledBy.toLowerCase()}.</p>
      
      <div style="background-color: #fef2f2; padding: 16px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444;">
        <h3 style="margin: 0 0 8px 0; color: #991b1b;">${eventTitle}</h3>
        <p style="margin: 4px 0; color: #7f1d1d; font-size: 14px;"><strong>Original Date & Time:</strong> ${formattedTime} (${timezone})</p>
        ${reason ? `<p style="margin: 4px 0; color: #7f1d1d; font-size: 14px;"><strong>Reason:</strong> ${reason}</p>` : ''}
      </div>
    </div>
  `;

  return { to: recipientEmail, subject, html, text };
}

export function buildRescheduleEmail(params: {
  recipientEmail: string;
  recipientName: string;
  eventTitle: string;
  oldStartTime: Date;
  newStartTime: Date;
  timezone: string;
  cancelToken?: string | null;
  rescheduleToken?: string | null;
  baseUrl?: string;
}): EmailPayload {
  const { recipientEmail, recipientName, eventTitle, oldStartTime, newStartTime, timezone, cancelToken, rescheduleToken, baseUrl = 'http://localhost:3000' } = params;

  const oldTimeStr = formatTimeInZone(oldStartTime, timezone, 'EEEE, MMMM d, yyyy @ hh:mm a');
  const newTimeStr = formatTimeInZone(newStartTime, timezone, 'EEEE, MMMM d, yyyy @ hh:mm a');

  const cancelUrl = cancelToken ? `${baseUrl}/cancel/${cancelToken}` : `${baseUrl}`;
  const rescheduleUrl = rescheduleToken ? `${baseUrl}/reschedule/${rescheduleToken}` : `${baseUrl}`;

  const subject = `Booking Rescheduled: ${eventTitle}`;
  const text = `Hi ${recipientName},\n\nYour meeting "${eventTitle}" has been rescheduled.\nOld Time: ${oldTimeStr}\nNew Time: ${newTimeStr} (${timezone}).\n\nReschedule Link: ${rescheduleUrl}\nCancel Link: ${cancelUrl}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
      <h2 style="color: #3b82f6; margin-bottom: 4px;">Meeting Rescheduled</h2>
      <p style="color: #64748b; font-size: 14px;">Hi <strong>${recipientName}</strong>, your meeting time has been updated.</p>
      
      <div style="background-color: #eff6ff; padding: 16px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6;">
        <h3 style="margin: 0 0 8px 0; color: #1e3a8a;">${eventTitle}</h3>
        <p style="margin: 4px 0; color: #1e40af; font-size: 14px; text-decoration: line-through;"><strong>Previous:</strong> ${oldTimeStr}</p>
        <p style="margin: 4px 0; color: #1e40af; font-size: 14px;"><strong>New Time:</strong> ${newTimeStr} (${timezone})</p>
      </div>

      <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 13px;">
        <a href="${rescheduleUrl}" style="color: #4f46e5; margin-right: 12px;">Reschedule again</a>
        <a href="${cancelUrl}" style="color: #ef4444;">Cancel Meeting</a>
      </div>
    </div>
  `;

  return { to: recipientEmail, subject, html, text };
}

export function buildReminderEmail(params: {
  recipientEmail: string;
  recipientName: string;
  eventTitle: string;
  hostName: string;
  startTime: Date;
  timezone: string;
  reminderLabel: string; // e.g. "24 Hours" or "1 Hour"
  cancelToken?: string | null;
  rescheduleToken?: string | null;
  baseUrl?: string;
}): EmailPayload {
  const { recipientEmail, recipientName, eventTitle, hostName, startTime, timezone, reminderLabel, cancelToken, rescheduleToken, baseUrl = 'http://localhost:3000' } = params;

  const timeStr = formatTimeInZone(startTime, timezone, 'EEEE, MMMM d, yyyy @ hh:mm a');
  const cancelUrl = cancelToken ? `${baseUrl}/cancel/${cancelToken}` : `${baseUrl}`;
  const rescheduleUrl = rescheduleToken ? `${baseUrl}/reschedule/${rescheduleToken}` : `${baseUrl}`;

  const subject = `Reminder (${reminderLabel}): ${eventTitle} with ${hostName}`;
  const text = `Hi ${recipientName},\n\nThis is a reminder that your meeting "${eventTitle}" with ${hostName} is starting in ${reminderLabel}.\nDate & Time: ${timeStr} (${timezone}).`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
      <h2 style="color: #f59e0b; margin-bottom: 4px;">Upcoming Meeting Reminder</h2>
      <p style="color: #64748b; font-size: 14px;">Hi <strong>${recipientName}</strong>, your meeting is starting in <strong>${reminderLabel}</strong>.</p>
      
      <div style="background-color: #fffbeb; padding: 16px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
        <h3 style="margin: 0 0 8px 0; color: #78350f;">${eventTitle}</h3>
        <p style="margin: 4px 0; color: #92400e; font-size: 14px;"><strong>Date & Time:</strong> ${timeStr} (${timezone})</p>
        <p style="margin: 4px 0; color: #92400e; font-size: 14px;"><strong>Host:</strong> ${hostName}</p>
      </div>

      <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 13px;">
        <a href="${rescheduleUrl}" style="color: #4f46e5; margin-right: 12px;">Reschedule</a>
        <a href="${cancelUrl}" style="color: #ef4444;">Cancel Meeting</a>
      </div>
    </div>
  `;

  return { to: recipientEmail, subject, html, text };
}
