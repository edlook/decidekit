import { redirect } from 'next/navigation'
import type { NextRequest } from 'next/server'

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  const { searchParams } = new URL(request.url)
  const sid     = searchParams.get('sid') ?? 'anonymous'
  const mode    = searchParams.get('mode') ?? 'direct'
  const variant = searchParams.get('variant') ?? ''

  const geo = request.headers.get('cf-ipcountry') ?? 'US'
  const ua  = request.headers.get('user-agent') ?? ''

  try {
    // Call NestJS affiliate redirect endpoint
    const res = await fetch(
      `${API_BASE}/r/${token}?sid=${sid}&mode=${mode}&variant=${variant}`,
      {
        method: 'GET',
        redirect: 'manual',   // Don't follow — we want the Location header
        headers: {
          'x-forwarded-for': request.headers.get('x-forwarded-for') ?? '',
          'x-country': geo,
          'user-agent': ua,
        },
      },
    )

    const location = res.headers.get('location')
    if (location) {
      redirect(location)
    }
  } catch {
    // fallback
  }

  redirect('/')
}
