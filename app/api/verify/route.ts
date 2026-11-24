import { NextRequest, NextResponse } from 'next/server';
import { SocietalScenarioId, SocietalVerificationResult } from '@/lib/realtimeModels';

interface VerifyPayload {
  scenarioId: SocietalScenarioId;
  primary: number;
  secondary: number;
  tertiary: number;
  crisisActive: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Partial<VerifyPayload>;
    const { scenarioId, primary, secondary, tertiary, crisisActive } = body;

    if (
      !scenarioId ||
      typeof primary !== 'number' ||
      typeof secondary !== 'number' ||
      typeof tertiary !== 'number'
    ) {
      return NextResponse.json(
        { error: 'Invalid societal telemetry payload.' },
        { status: 400 }
      );
    }

    const now = new Date().toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    let result: SocietalVerificationResult;

    if (scenarioId === 'air') {
      const pmOk = primary <= 25;
      const heatOk = secondary <= 32;
      const aqiOk = tertiary <= 75;
      const passed = pmOk && heatOk && aqiOk;

      result = {
        scenarioId,
        passed,
        timestamp: now,
        headline: passed
          ? crisisActive
            ? 'Neighborhood Air & Heat Safely Mitigated Under Peak Traffic'
            : 'Urban Air Quality Within WHO Safe Exposure Limits'
          : 'PM2.5 or Urban Heat Index Exceeds Public Health Threshold',
        checks: [
          {
            label: 'PM2.5 Concentration',
            actual: `${primary.toFixed(1)} µg/m³`,
            target: '≤ 25.0 µg/m³',
            ok: pmOk,
          },
          {
            label: 'Heat Index',
            actual: `${secondary.toFixed(1)} °C`,
            target: '≤ 32.0 °C',
            ok: heatOk,
          },
          {
            label: 'Air Quality Index',
            actual: `${Math.round(tertiary)} AQI`,
            target: '≤ 75 AQI',
            ok: aqiOk,
          },
        ],
      };
    } else if (scenarioId === 'water') {
      const pressOk = primary >= 260 && primary <= 340;
      const lossOk = secondary <= 8.0;
      const clinicOk = tertiary >= 95;
      const passed = pressOk && lossOk && clinicOk;

      result = {
        scenarioId,
        passed,
        timestamp: now,
        headline: passed
          ? 'Clean Water Pressure Restored & Leak Loss Contained'
          : 'Tap Pressure Instability or Excessive Water Loss Detected',
        checks: [
          {
            label: 'Zone Tap Pressure',
            actual: `${primary.toFixed(0)} kPa`,
            target: '260–340 kPa',
            ok: pressOk,
          },
          {
            label: 'Non-Revenue Water Loss',
            actual: `${secondary.toFixed(1)}%`,
            target: '≤ 8.0%',
            ok: lossOk,
          },
          {
            label: 'Clinic Supply Coverage',
            actual: `${tertiary.toFixed(0)}%`,
            target: '≥ 95%',
            ok: clinicOk,
          },
        ],
      };
    } else if (scenarioId === 'ems') {
      const respOk = primary <= 8.0;
      const erOk = secondary < 85;
      const offloadOk = tertiary <= 14;
      const passed = respOk && erOk && offloadOk;

      result = {
        scenarioId,
        passed,
        timestamp: now,
        headline: passed
          ? 'EMS Response Time & Regional ER Capacity Balanced'
          : 'Ambulance Delay or ER Saturation Threatens Patient Access',
        checks: [
          {
            label: 'Avg EMS Response',
            actual: `${primary.toFixed(1)} min`,
            target: '≤ 8.0 min',
            ok: respOk,
          },
          {
            label: 'Central ER Occupancy',
            actual: `${secondary.toFixed(1)}%`,
            target: '< 85.0%',
            ok: erOk,
          },
          {
            label: 'Ambulance Offload Wait',
            actual: `${tertiary.toFixed(1)} min`,
            target: '≤ 14.0 min',
            ok: offloadOk,
          },
        ],
      };
    } else {
      const freqOk = primary >= 59.9 && primary <= 60.1;
      const reserveOk = secondary >= 12;
      const blackoutOk = tertiary <= 0.5;
      const passed = freqOk && reserveOk && blackoutOk;

      result = {
        scenarioId,
        passed,
        timestamp: now,
        headline: passed
          ? 'Clean Energy Grid Stabilized With Zero Blackout Risk'
          : 'Evening Peak Deficit Risks Rolling Neighborhood Outages',
        checks: [
          {
            label: 'Grid Frequency',
            actual: `${primary.toFixed(2)} Hz`,
            target: '59.90–60.10 Hz',
            ok: freqOk,
          },
          {
            label: 'Spinning Clean Reserve',
            actual: `${secondary.toFixed(1)}%`,
            target: '≥ 12.0%',
            ok: reserveOk,
          },
          {
            label: 'Blackout Probability',
            actual: `${tertiary.toFixed(1)}%`,
            target: '≤ 0.5%',
            ok: blackoutOk,
          },
        ],
      };
    }

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: 'Failed to verify societal telemetry.' },
      { status: 500 }
    );
  }
}
