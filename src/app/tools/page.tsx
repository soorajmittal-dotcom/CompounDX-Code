'use client';

import { useState, useMemo } from 'react';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { useSettings } from '@/lib/db-hooks';
import { Calculator, Weight } from 'lucide-react';

function estimate1RM(weight: number, reps: number): number {
  if (reps === 1) return weight;
  return Math.round(weight * (1 + reps / 30));
}

function repMaxTable(oneRM: number): { reps: number; weight: number; pct: number }[] {
  const percentages = [100, 95, 90, 85, 80, 75, 70, 65, 60];
  const repRanges = [1, 2, 3, 5, 6, 8, 10, 12, 15];
  return percentages.map((pct, i) => ({
    reps: repRanges[i],
    weight: Math.round(oneRM * pct / 100),
    pct,
  }));
}

const PLATES_LBS = [45, 35, 25, 10, 5, 2.5];
const PLATES_KG = [25, 20, 15, 10, 5, 2.5, 1.25];
const BAR_LBS = 45;
const BAR_KG = 20;

function calculatePlates(targetWeight: number, unit: 'lbs' | 'kg'): { plate: number; count: number }[] {
  const barWeight = unit === 'lbs' ? BAR_LBS : BAR_KG;
  const plates = unit === 'lbs' ? PLATES_LBS : PLATES_KG;

  let remaining = (targetWeight - barWeight) / 2;
  if (remaining <= 0) return [];

  const result: { plate: number; count: number }[] = [];
  for (const plate of plates) {
    const count = Math.floor(remaining / plate);
    if (count > 0) {
      result.push({ plate, count });
      remaining -= count * plate;
    }
  }
  return result;
}

export default function ToolsPage() {
  const settings = useSettings();
  const unit = settings?.weightUnit ?? 'lbs';

  const [rmWeight, setRmWeight] = useState('');
  const [rmReps, setRmReps] = useState('');
  const [plateTarget, setPlateTarget] = useState('');

  const oneRM = rmWeight && rmReps
    ? estimate1RM(Number(rmWeight), Number(rmReps))
    : 0;

  const rmTable = useMemo(() => (oneRM > 0 ? repMaxTable(oneRM) : []), [oneRM]);

  const plateResult = useMemo(() => {
    if (!plateTarget) return null;
    const target = Number(plateTarget);
    const barWeight = unit === 'lbs' ? BAR_LBS : BAR_KG;
    if (target < barWeight) return null;
    return calculatePlates(target, unit);
  }, [plateTarget, unit]);

  const barWeight = unit === 'lbs' ? BAR_LBS : BAR_KG;

  return (
    <div>
      <Header title="Tools" showBack />

      <div className="px-4 py-4 space-y-6">
        {/* 1RM Calculator */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Calculator className="h-4 w-4 text-indigo-400" />
            <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">1RM Calculator</h2>
          </div>
          <Card className="space-y-3">
            <p className="text-xs text-zinc-500">Enter the weight and reps you performed to estimate your one-rep max.</p>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label={`Weight (${unit})`}
                type="number"
                inputMode="numeric"
                placeholder="185"
                value={rmWeight}
                onChange={(e) => setRmWeight(e.target.value)}
              />
              <Input
                label="Reps"
                type="number"
                inputMode="numeric"
                placeholder="5"
                value={rmReps}
                onChange={(e) => setRmReps(e.target.value)}
              />
            </div>

            {oneRM > 0 && (
              <>
                <div className="text-center py-3 bg-indigo-900/20 rounded-xl border border-indigo-800/30">
                  <div className="text-xs text-indigo-400 mb-1">Estimated 1RM</div>
                  <div className="text-3xl font-bold text-zinc-100">{oneRM} <span className="text-lg text-zinc-500">{unit}</span></div>
                </div>

                <div className="space-y-1">
                  <div className="grid grid-cols-3 text-[10px] text-zinc-500 uppercase tracking-wider px-1">
                    <span>Reps</span>
                    <span>Weight</span>
                    <span>%1RM</span>
                  </div>
                  {rmTable.map(({ reps, weight, pct }) => (
                    <div key={reps} className="grid grid-cols-3 text-sm px-1 py-1 border-b border-zinc-800 last:border-0">
                      <span className="text-zinc-400">{reps}</span>
                      <span className="text-zinc-100 font-medium">{weight} {unit}</span>
                      <span className="text-zinc-500">{pct}%</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </Card>
        </div>

        {/* Plate Calculator */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Weight className="h-4 w-4 text-emerald-400" />
            <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Plate Calculator</h2>
          </div>
          <Card className="space-y-3">
            <p className="text-xs text-zinc-500">
              Enter your target weight to see which plates to load on each side.
              Bar weight: {barWeight} {unit}.
            </p>
            <Input
              label={`Target Weight (${unit})`}
              type="number"
              inputMode="numeric"
              placeholder="225"
              value={plateTarget}
              onChange={(e) => setPlateTarget(e.target.value)}
            />

            {plateResult !== null && (
              <div className="space-y-3">
                {plateResult.length === 0 ? (
                  <div className="text-center py-3 text-sm text-zinc-500">
                    Just the bar ({barWeight} {unit})
                  </div>
                ) : (
                  <>
                    <div className="text-xs text-zinc-400 text-center">Per side:</div>
                    <div className="flex items-end justify-center gap-1">
                      {/* Bar */}
                      <div className="flex flex-col items-center">
                        <div className="w-3 h-20 bg-zinc-600 rounded-sm" />
                        <span className="text-[9px] text-zinc-500 mt-1">Bar</span>
                      </div>
                      {/* Plates */}
                      {plateResult.map(({ plate, count }) => (
                        Array.from({ length: count }, (_, i) => (
                          <div key={`${plate}-${i}`} className="flex flex-col items-center">
                            <div
                              className="rounded-sm bg-indigo-600 flex items-center justify-center text-white font-bold"
                              style={{
                                width: `${Math.max(24, plate >= 25 ? 36 : plate >= 10 ? 30 : 24)}px`,
                                height: `${Math.max(40, Math.min(80, plate * (unit === 'lbs' ? 1.5 : 2.8)))}px`,
                                fontSize: plate >= 25 ? '11px' : '9px',
                              }}
                            >
                              {plate}
                            </div>
                          </div>
                        ))
                      ))}
                    </div>

                    <div className="space-y-1">
                      {plateResult.map(({ plate, count }) => (
                        <div key={plate} className="flex items-center justify-between text-sm px-1">
                          <span className="text-zinc-300">{plate} {unit} plate</span>
                          <Badge variant="indigo">{count} per side</Badge>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
