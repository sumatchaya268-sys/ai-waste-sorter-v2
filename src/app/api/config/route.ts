import { NextResponse } from 'next/server';

export async function GET() {
  // Return the first available key for client-side usage
  const apiKeys = (process.env.GEMINI_API_KEY || '').split(',').map(k => k.trim()).filter(Boolean);
  const randomKey = apiKeys[Math.floor(Math.random() * apiKeys.length)] || '';
  
  return NextResponse.json({ key: randomKey });
}
