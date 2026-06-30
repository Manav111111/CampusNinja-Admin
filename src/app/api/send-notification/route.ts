// ============================================================
// SEND NOTIFICATION API ROUTE
// POST /api/send-notification
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { sendFirebaseNotification } from '@/utils/firebaseAdmin'

export async function POST(request: NextRequest) {
  try {
    const { userId, tokens, title, body, data, sendToAll, targetBranchId, targetSemesterId } = await request.json()

    if (!title || !body) {
      return NextResponse.json(
        { error: 'Missing required fields: title and body' },
        { status: 400 }
      )
    }

    const result = await sendFirebaseNotification({
      title,
      body,
      data,
      tokens,
      targetBranchId,
      targetSemesterId,
      sendToAll,
    })

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json(result)
  } catch (err: any) {
    console.error('❌ Send notification API error:', err?.message || err)
    return NextResponse.json(
      { error: err?.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
