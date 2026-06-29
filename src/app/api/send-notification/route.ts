// ============================================================
// SEND NOTIFICATION API ROUTE
// POST /api/send-notification
//
// Sends a push notification to a specific user or to all users
// using Firebase Cloud Messaging via the Admin SDK.
//
// Request body:
// {
//   userId?: string,        // Target a specific user (looks up their FCM token)
//   tokens?: string[],      // Or provide FCM tokens directly
//   title: string,          // Notification title
//   body: string,           // Notification body text
//   data?: object,          // Custom payload (screen, params, etc.)
//   sendToAll?: boolean     // Send to all registered devices
// }
//
// Response:
// { success: true, successCount: N, failureCount: N }
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import admin from 'firebase-admin'

// ── Initialize Firebase Admin SDK (singleton) ──────────────────
// Uses environment variables from .env.local
// The private key is stored as an env var, never hardcoded.
if (!admin.apps.length) {
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
  
  if (!privateKey || !process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL) {
    console.error('❌ Missing Firebase Admin SDK environment variables')
  } else {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey,
      }),
    })
    console.log('✅ Firebase Admin SDK initialized')
  }
}

export async function POST(request: NextRequest) {
  try {
    // ── 1. Validate Firebase Admin is initialized ────────────
    if (!admin.apps.length) {
      return NextResponse.json(
        { error: 'Firebase Admin SDK not initialized. Check environment variables.' },
        { status: 500 }
      )
    }

    // ── 2. Parse request body ────────────────────────────────
    const { userId, tokens: providedTokens, title, body, data, sendToAll } = await request.json()

    if (!title || !body) {
      return NextResponse.json(
        { error: 'Missing required fields: title and body' },
        { status: 400 }
      )
    }

    // ── 3. Get FCM tokens ────────────────────────────────────
    let fcmTokens: string[] = []

    if (providedTokens && Array.isArray(providedTokens) && providedTokens.length > 0) {
      // Tokens provided directly
      fcmTokens = providedTokens
    } else {
      // Look up tokens from Supabase
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

      if (!supabaseUrl || !serviceRoleKey) {
        return NextResponse.json(
          { error: 'Supabase credentials not configured' },
          { status: 500 }
        )
      }

      const supabase = createClient(supabaseUrl, serviceRoleKey, {
        auth: { persistSession: false },
      })

      if (sendToAll) {
        // Send to ALL registered devices
        const { data: allTokens, error } = await supabase
          .from('device_tokens')
          .select('token')
        
        if (error) {
          console.error('Error fetching all tokens:', error)
          return NextResponse.json({ error: 'Failed to fetch device tokens' }, { status: 500 })
        }

        fcmTokens = (allTokens || []).map((t: { token: string }) => t.token)
      } else if (userId) {
        // Send to a specific user's devices
        const { data: userTokens, error } = await supabase
          .from('device_tokens')
          .select('token')
          .eq('user_id', userId)

        if (error) {
          console.error('Error fetching user tokens:', error)
          return NextResponse.json({ error: 'Failed to fetch user device tokens' }, { status: 500 })
        }

        fcmTokens = (userTokens || []).map((t: { token: string }) => t.token)
      } else {
        return NextResponse.json(
          { error: 'Must provide userId, tokens array, or set sendToAll: true' },
          { status: 400 }
        )
      }
    }

    if (fcmTokens.length === 0) {
      return NextResponse.json(
        { error: 'No device tokens found for the specified target' },
        { status: 404 }
      )
    }

    console.log(`📤 Sending notification to ${fcmTokens.length} device(s): "${title}"`)

    // ── 4. Build the FCM message ─────────────────────────────
    // Using sendEachForMulticast for batch sending
    const message: admin.messaging.MulticastMessage = {
      tokens: fcmTokens,
      notification: {
        title,
        body,
      },
      data: data ? Object.fromEntries(
        Object.entries(data).map(([key, value]) => [key, typeof value === 'string' ? value : JSON.stringify(value)])
      ) : undefined,
      android: {
        priority: 'high' as const,
        notification: {
          channelId: 'campus-ninja-default',
          icon: 'notification_icon',
          color: '#FF6B00',
          sound: 'default',
        },
      },
    }

    // ── 5. Send via Firebase Admin SDK ───────────────────────
    const response = await admin.messaging().sendEachForMulticast(message)

    console.log(`✅ Notification sent: ${response.successCount} success, ${response.failureCount} failures`)

    // Log any failures for debugging
    if (response.failureCount > 0) {
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          console.error(`  ❌ Token[${idx}] failed:`, resp.error?.message)
        }
      })
    }

    return NextResponse.json({
      success: true,
      successCount: response.successCount,
      failureCount: response.failureCount,
    })
  } catch (err: any) {
    console.error('❌ Send notification error:', err?.message || err)
    return NextResponse.json(
      { error: err?.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
