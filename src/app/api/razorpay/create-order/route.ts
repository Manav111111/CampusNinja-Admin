import { NextResponse } from 'next/server'
import Razorpay from 'razorpay'

// Ensure we have Razorpay keys in env
const key_id = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID
const key_secret = process.env.RAZORPAY_KEY_SECRET

export async function POST(req: Request) {
  try {
    if (!key_id || !key_secret) {
      console.error('Razorpay keys are missing from environment variables')
      return NextResponse.json(
        { error: 'Payment gateway configuration error.' },
        { status: 500 }
      )
    }

    const body = await req.json()
    const { amount, currency = 'INR', receipt = 'receipt_order_1' } = body

    if (!amount) {
      return NextResponse.json({ error: 'Amount is required' }, { status: 400 })
    }

    const instance = new Razorpay({
      key_id,
      key_secret,
    })

    const options = {
      amount: amount * 100, // amount in smallest currency unit (paise)
      currency,
      receipt,
    }

    const order = await instance.orders.create(options)
    
    return NextResponse.json({ order })
  } catch (error: any) {
    console.error('Razorpay Order Creation Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create order' },
      { status: 500 }
    )
  }
}
