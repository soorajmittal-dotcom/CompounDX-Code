'use client';

import { useRef, useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useSettings } from '@/lib/db-hooks';
import { db } from '@/lib/db';
import { exportAllData, importData } from '@/lib/export';
import { UserSettings } from '@/types';
import { Download, Upload, Trash2, Save } from 'lucide-react';

export default function SettingsPage() {
  const settings = useSettings();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState('');

  if (!settings) {
    return (
      <div>
        <Header title="Settings" />
        <div className="flex items-center justify-center h-64 text-zinc-500">Loading...</div>
      </div>
    );
  }

  const update = async (updates: Partial<UserSettings>) => {
    await db.settings.update('user-settings', updates);
  };

  const handleExport = async () => {
    const data = await exportAllData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `compoundx-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setMessage('Data exported successfully');
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const result = await importData(text);
      setMessage(`Imported ${result.workouts} workouts, ${result.nutrition} nutrition entries`);
    } catch {
      setMessage('Failed to import data. Check the file format.');
    }
    e.target.value = '';
  };

  const handleClearAll = async () => {
    if (window.confirm('Are you sure? This will delete ALL your data permanently.')) {
      await Promise.all([
        db.workouts.clear(),
        db.nutrition.clear(),
      ]);
      setMessage('All data cleared');
    }
  };

  return (
    <div>
      <Header title="Settings" />

      <div className="px-4 py-4 space-y-5">
        {message && (
          <div className="p-3 rounded-xl bg-indigo-900/20 text-indigo-400 text-sm">
            {message}
          </div>
        )}

        <div>
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3">Units</h2>
          <Card className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-300">Weight Unit</span>
              <div className="flex gap-1">
                {(['lbs', 'kg'] as const).map((unit) => (
                  <button
                    key={unit}
                    onClick={() => update({ weightUnit: unit })}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      settings.weightUnit === unit ? 'bg-indigo-600 text-white' : 'bg-zinc-800 text-zinc-400'
                    }`}
                  >
                    {unit}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-300">Distance Unit</span>
              <div className="flex gap-1">
                {(['mi', 'km'] as const).map((unit) => (
                  <button
                    key={unit}
                    onClick={() => update({ distanceUnit: unit })}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      settings.distanceUnit === unit ? 'bg-indigo-600 text-white' : 'bg-zinc-800 text-zinc-400'
                    }`}
                  >
                    {unit}
                  </button>
                ))}
              </div>
            </div>
          </Card>
        </div>

        <div>
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3">Nutrition Goals</h2>
          <Card className="space-y-3">
            <Input
              label="Daily Calories"
              type="number"
              inputMode="numeric"
              value={settings.calorieGoal}
              onChange={(e) => update({ calorieGoal: Number(e.target.value) })}
            />
            <div className="grid grid-cols-3 gap-3">
              <Input
                label="Protein (g)"
                type="number"
                inputMode="numeric"
                value={settings.proteinGoal}
                onChange={(e) => update({ proteinGoal: Number(e.target.value) })}
              />
              <Input
                label="Carbs (g)"
                type="number"
                inputMode="numeric"
                value={settings.carbGoal}
                onChange={(e) => update({ carbGoal: Number(e.target.value) })}
              />
              <Input
                label="Fat (g)"
                type="number"
                inputMode="numeric"
                value={settings.fatGoal}
                onChange={(e) => update({ fatGoal: Number(e.target.value) })}
              />
            </div>
          </Card>
        </div>

        <div>
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3">Data</h2>
          <div className="space-y-2">
            <Button variant="secondary" onClick={handleExport} className="w-full">
              <Download className="h-4 w-4 mr-2" /> Export Data
            </Button>
            <Button variant="secondary" onClick={() => fileInputRef.current?.click()} className="w-full">
              <Upload className="h-4 w-4 mr-2" /> Import Data
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />
            <Button variant="danger" onClick={handleClearAll} className="w-full">
              <Trash2 className="h-4 w-4 mr-2" /> Clear All Data
            </Button>
          </div>
        </div>

        <div>
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3">Integrations</h2>
          <Card>
            <div className="space-y-3 text-sm text-zinc-500">
              <div className="flex items-center justify-between">
                <span>Apple Health</span>
                <span className="text-xs bg-zinc-800 px-2 py-0.5 rounded">Coming Soon</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Google Fit</span>
                <span className="text-xs bg-zinc-800 px-2 py-0.5 rounded">Coming Soon</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Strava</span>
                <span className="text-xs bg-zinc-800 px-2 py-0.5 rounded">Coming Soon</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
