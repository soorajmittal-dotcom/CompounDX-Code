'use client';

import { useState, useEffect } from 'react';
import { useSettings } from '@/lib/db-hooks';
import { db } from '@/lib/db';
import { SUBJECTS } from '@/lib/subjects';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Subject } from '@/types';
import { Save, GraduationCap, Trash2 } from 'lucide-react';

export default function SettingsPage() {
  const settings = useSettings();
  const [name, setName] = useState('');
  const [dailyGoal, setDailyGoal] = useState(20);
  const [targetScore, setTargetScore] = useState(90);
  const [examDate, setExamDate] = useState('');
  const [selectedSubjects, setSelectedSubjects] = useState<Subject[]>([]);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (settings) {
      setName(settings.name ?? '');
      setDailyGoal(settings.dailyGoal);
      setTargetScore(settings.targetScore ?? 90);
      setExamDate(settings.examDate ?? '');
      setSelectedSubjects(settings.subjects);
    }
  }, [settings]);

  const handleSave = async () => {
    await db.settings.put({
      id: 'student-settings',
      name: name || undefined,
      dailyGoal,
      targetScore,
      examDate: examDate || undefined,
      subjects: selectedSubjects,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const toggleSubject = (subject: Subject) => {
    setSelectedSubjects((prev) =>
      prev.includes(subject)
        ? prev.filter((s) => s !== subject)
        : [...prev, subject]
    );
  };

  const handleClearData = async () => {
    if (confirm('This will delete all your practice data, scores, and progress. Are you sure?')) {
      await db.attempts.clear();
      await db.sessions.clear();
      await db.mastery.clear();
      window.location.reload();
    }
  };

  return (
    <div className="px-4 py-6 space-y-5">
      <div className="flex items-center gap-2">
        <GraduationCap className="h-5 w-5 text-indigo-400" />
        <h1 className="text-xl font-bold text-zinc-100">Settings</h1>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-2">Profile</h2>
        <Card className="space-y-3">
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
            />
          </div>
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">Target Score (%)</label>
            <Input
              type="number"
              value={targetScore}
              onChange={(e) => setTargetScore(parseInt(e.target.value) || 0)}
              min={0}
              max={100}
            />
          </div>
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">Exam Date</label>
            <Input
              type="date"
              value={examDate}
              onChange={(e) => setExamDate(e.target.value)}
            />
          </div>
        </Card>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-2">Daily Goal</h2>
        <Card>
          <label className="text-xs text-zinc-500 mb-1 block">Questions per day</label>
          <div className="flex gap-2">
            {[10, 20, 30, 50].map((n) => (
              <button
                key={n}
                onClick={() => setDailyGoal(n)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                  dailyGoal === n
                    ? 'bg-indigo-600 text-white'
                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </Card>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-2">Subjects</h2>
        <Card>
          <div className="grid grid-cols-2 gap-2">
            {SUBJECTS.map((subject) => {
              const isSelected = selectedSubjects.includes(subject.id);
              return (
                <button
                  key={subject.id}
                  onClick={() => toggleSubject(subject.id)}
                  className={`py-2 px-3 rounded-lg text-sm font-medium text-left transition-colors ${
                    isSelected
                      ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
                      : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 border border-transparent'
                  }`}
                >
                  {subject.name}
                </button>
              );
            })}
          </div>
        </Card>
      </div>

      <Button onClick={handleSave} className="w-full">
        <Save className="h-4 w-4 mr-2" />
        {saved ? 'Saved!' : 'Save Settings'}
      </Button>

      <div>
        <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-2">Data</h2>
        <Card>
          <Button variant="danger" onClick={handleClearData} className="w-full" size="sm">
            <Trash2 className="h-4 w-4 mr-2" />
            Clear All Practice Data
          </Button>
          <p className="text-[10px] text-zinc-600 mt-2 text-center">
            This will permanently delete all your progress and scores.
          </p>
        </Card>
      </div>
    </div>
  );
}
