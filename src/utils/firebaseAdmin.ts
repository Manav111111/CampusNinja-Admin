import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getMessaging, MulticastMessage } from 'firebase-admin/messaging';
import { createAdminClient } from '@/utils/supabase/server';

// Initialize Firebase Admin SDK (singleton)
export function getFirebaseAdmin() {
  if (getApps().length === 0) {
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (!privateKey || !process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL) {
      console.error('❌ [Firebase Admin] Missing environment variables (FIREBASE_PRIVATE_KEY, PROJECT_ID, CLIENT_EMAIL)');
      return null;
    }

    try {
      initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey,
        }),
      });
      console.log('✅ [Firebase Admin] Initialized successfully');
    } catch (err: any) {
      console.error('❌ [Firebase Admin] Initialization error:', err.message);
      return null;
    }
  }
  return true;
}

export async function sendFirebaseNotification({
  title,
  body,
  data,
  tokens: providedTokens,
  targetBranchId,
  targetSemesterId,
  sendToAll,
}: {
  title: string;
  body: string;
  data?: Record<string, any>;
  tokens?: string[];
  targetBranchId?: string | null;
  targetSemesterId?: string | null;
  sendToAll?: boolean;
}) {
  const firebaseApp = getFirebaseAdmin();
  if (!firebaseApp) {
    console.error('❌ [Push Notification] Cannot send: Firebase Admin SDK not initialized.');
    return { success: false, error: 'Firebase Admin SDK not initialized' };
  }

  let fcmTokens: string[] = [];

  if (providedTokens && providedTokens.length > 0) {
    fcmTokens = providedTokens;
  } else {
    const supabase = await createAdminClient();
    let query = supabase.from('device_tokens').select('token, branch_id, semester_id');

    if (!sendToAll) {
      if (targetBranchId) {
        query = query.or(`branch_id.eq.${targetBranchId},branch_id.is.null`);
      }
      if (targetSemesterId) {
        query = query.or(`semester_id.eq.${targetSemesterId},semester_id.is.null`);
      }
    }

    const { data: tokenRows, error } = await query;
    if (error) {
      console.error('❌ [Push Notification] Error fetching tokens from Supabase:', error);
      return { success: false, error: 'Failed to fetch device tokens' };
    }

    fcmTokens = (tokenRows || [])
      .map((t: { token: string }) => t.token)
      .filter((token: string) => token && !token.startsWith('ExponentPushToken'));
  }

  // Remove duplicates
  fcmTokens = Array.from(new Set(fcmTokens));

  if (fcmTokens.length === 0) {
    console.log('⚠️ [Push Notification] No valid FCM tokens found matching target criteria.');
    return { success: true, successCount: 0, failureCount: 0, message: 'No devices found' };
  }

  console.log(`📤 [Push Notification] Sending to ${fcmTokens.length} device(s): "${title}"`);

  const stringData = data
    ? Object.fromEntries(
        Object.entries(data).map(([key, value]) => [
          key,
          typeof value === 'string' ? value : JSON.stringify(value),
        ])
      )
    : undefined;

  const message: MulticastMessage = {
    tokens: fcmTokens,
    notification: {
      title,
      body,
    },
    data: stringData,
    android: {
      priority: 'high',
      notification: {
        channelId: 'campus-ninja-default',
        color: '#FF6B00',
        sound: 'default',
      },
    },
  };

  try {
    const response = await getMessaging().sendEachForMulticast(message);
    console.log(`✅ [Push Notification] Sent: ${response.successCount} succeeded, ${response.failureCount} failed.`);

    // Handle invalid/unregistered tokens by removing them from Supabase
    if (response.failureCount > 0) {
      const invalidTokens: string[] = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success && resp.error) {
          const errCode = resp.error.code;
          console.error(`  ❌ Token[${idx}] failed (${errCode}):`, resp.error.message);
          if (
            errCode === 'messaging/invalid-registration-token' ||
            errCode === 'messaging/registration-token-not-registered'
          ) {
            invalidTokens.push(fcmTokens[idx]);
          }
        }
      });

      if (invalidTokens.length > 0) {
        console.log(`🗑️ [Push Notification] Removing ${invalidTokens.length} stale/invalid token(s) from device_tokens...`);
        const supabase = await createAdminClient();
        await supabase.from('device_tokens').delete().in('token', invalidTokens);
      }
    }

    return {
      success: true,
      successCount: response.successCount,
      failureCount: response.failureCount,
    };
  } catch (err: any) {
    console.error('❌ [Push Notification] Multicast send error:', err.message || err);
    return { success: false, error: err.message || 'Error sending push notifications' };
  }
}
