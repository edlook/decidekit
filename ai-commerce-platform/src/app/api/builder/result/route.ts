import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api'

// Proxy to NestJS backend
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const res = await fetch(`${API_BASE}/builder/result`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (err) {
    return NextResponse.json(
      { error: 'Backend unavailable', code: 'BACKEND_ERROR' },
      { status: 503 },
    )
  }
}
