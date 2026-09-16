import { NextResponse } from 'next/server';
import { analyzeWaste } from '@/lib/ai';

export const maxDuration = 60; // Prevent Vercel 10s timeout

export async function POST(req: Request) {
  try {
    const { image, mode } = await req.json();

    if (!image) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    if (!['general', 'school'].includes(mode)) {
      return NextResponse.json({ error: 'Invalid mode' }, { status: 400 });
    }

    const result = await analyzeWaste(image, mode as 'general' | 'school');
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
