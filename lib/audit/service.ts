import { db } from '@/lib/db/prisma';

export interface RecordAuditInput {
  userId: string;
  action:
    | 'LOGIN'
    | 'LOGOUT'
    | 'PROFILE_UPDATED'
    | 'PASSWORD_CHANGED'
    | 'EVENT_CREATED'
    | 'EVENT_UPDATED'
    | 'EVENT_DELETED'
    | 'BOOKING_CREATED'
    | 'BOOKING_CANCELLED'
    | 'BOOKING_APPROVED'
    | 'BOOKING_REJECTED'
    | 'BOOKING_NO_SHOW'
    | 'BOOKING_ATTENDED'
    | 'BOOKING_RESCHEDULED'
    | 'WEBHOOK_CREATED'
    | 'WEBHOOK_DELETED'
    | 'SUBSCRIPTION_CREATED'
    | 'SUBSCRIPTION_UPDATED'
    | 'SUBSCRIPTION_CANCELLED'
    | 'PAYMENT_FAILED';
  entityType: 'USER' | 'EVENT_TYPE' | 'BOOKING' | 'WEBHOOK' | 'SUBSCRIPTION';
  entityId?: string | null;
  metadata?: Record<string, any> | null;
}

export async function recordAuditLog(input: RecordAuditInput): Promise<void> {
  try {
    const cleanMetadata = input.metadata ? { ...input.metadata } : {};
    // Ensure sensitive properties are never recorded
    delete cleanMetadata.password;
    delete cleanMetadata.passwordHash;
    delete cleanMetadata.currentPassword;
    delete cleanMetadata.newPassword;
    delete cleanMetadata.sessionToken;
    delete cleanMetadata.token;
    delete cleanMetadata.secret;
    delete cleanMetadata.secretKey;
    delete cleanMetadata.billingSecret;

    await db.auditLog.create({
      data: {
        userId: input.userId,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId || null,
        metadata: Object.keys(cleanMetadata).length > 0 ? JSON.stringify(cleanMetadata) : null,
      },
    });
  } catch (err) {
    console.error('Audit Log Non-Blocking Error:', err);
  }
}
