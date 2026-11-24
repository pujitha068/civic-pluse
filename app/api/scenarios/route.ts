import { NextResponse } from 'next/server';
import { SOCIETAL_SCENARIOS } from '@/lib/realtimeModels';

export async function GET() {
  return NextResponse.json({
    scenarios: SOCIETAL_SCENARIOS,
  });
}
