import { NextRequest, NextResponse } from 'next/server';
import {
  CivicIssueCategory,
  CivicSeverity,
  CommunityReport,
  INITIAL_COMMUNITY_REPORTS,
} from '@/lib/realtimeModels';

const VALID_CATEGORIES: CivicIssueCategory[] = [
  'Air & Heat',
  'Water & Sanitation',
  'Emergency & Safety',
  'Power & Outage',
];

const VALID_SEVERITIES: CivicSeverity[] = ['Advisory', 'Urgent', 'Critical'];

export async function GET() {
  return NextResponse.json({
    reports: INITIAL_COMMUNITY_REPORTS,
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Partial<CommunityReport>;
    const zone = typeof body.zone === 'string' ? body.zone.trim() : '';
    const title = typeof body.title === 'string' ? body.title.trim() : '';
    const actionNote = typeof body.actionNote === 'string' ? body.actionNote.trim() : '';
    const category = VALID_CATEGORIES.includes(body.category as CivicIssueCategory)
      ? (body.category as CivicIssueCategory)
      : 'Air & Heat';
    const severity = VALID_SEVERITIES.includes(body.severity as CivicSeverity)
      ? (body.severity as CivicSeverity)
      : 'Advisory';

    if (zone.length < 2 || title.length < 4) {
      return NextResponse.json(
        { error: 'Provide both a neighborhood zone and clear issue description.' },
        { status: 400 }
      );
    }

    const reportedAt = new Date().toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
    });

    const created: CommunityReport = {
      id: `rep-${Date.now()}`,
      zone: zone.slice(0, 80),
      category,
      severity,
      title: title.slice(0, 140),
      actionNote: actionNote.slice(0, 220),
      status: severity === 'Critical' ? 'Dispatched' : 'Open',
      reportedAt,
    };

    return NextResponse.json({ report: created }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: 'Unable to process civic report.' },
      { status: 400 }
    );
  }
}
