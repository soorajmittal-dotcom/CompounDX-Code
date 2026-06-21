'use client';

import { useState } from 'react';
import { v4 as uuid } from 'uuid';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { db } from '@/lib/db';
import { ExerciseCategory, MuscleGroup, Equipment } from '@/types';
import { muscleGroupLabel } from '@/lib/utils';

const categories: ExerciseCategory[] = ['strength', 'bodyweight', 'cardio', 'flexibility', 'olympic'];
const muscleGroups: MuscleGroup[] = [
  'chest', 'back', 'shoulders', 'biceps', 'triceps', 'forearms',
  'quads', 'hamstrings', 'glutes', 'calves', 'abs', 'obliques', 'full_body',
];
const equipmentList: Equipment[] = ['barbell', 'dumbbell', 'cable', 'machine', 'bodyweight', 'kettlebell', 'band', 'none'];

interface CreateExerciseSheetProps {
  open: boolean;
  onClose: () => void;
}

export function CreateExerciseSheet({ open, onClose }: CreateExerciseSheetProps) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<ExerciseCategory>('strength');
  const [selectedMuscles, setSelectedMuscles] = useState<MuscleGroup[]>([]);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment[]>([]);

  const toggleMuscle = (mg: MuscleGroup) => {
    setSelectedMuscles((prev) =>
      prev.includes(mg) ? prev.filter((m) => m !== mg) : [...prev, mg]
    );
  };

  const toggleEquipment = (eq: Equipment) => {
    setSelectedEquipment((prev) =>
      prev.includes(eq) ? prev.filter((e) => e !== eq) : [...prev, eq]
    );
  };

  const handleCreate = async () => {
    if (!name.trim() || selectedMuscles.length === 0) return;

    await db.exercises.add({
      id: uuid(),
      name: name.trim(),
      category,
      muscleGroups: selectedMuscles,
      equipment: selectedEquipment.length > 0 ? selectedEquipment : ['none'],
      isCustom: true,
    });

    setName('');
    setCategory('strength');
    setSelectedMuscles([]);
    setSelectedEquipment([]);
    onClose();
  };

  return (
    <BottomSheet open={open} onClose={onClose} title="Create Exercise">
      <div className="space-y-4">
        <Input
          label="Exercise Name"
          placeholder="e.g. Zercher Squat"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <div>
          <p className="text-sm text-zinc-400 mb-2">Category</p>
          <div className="flex flex-wrap gap-1.5">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-colors ${
                  cat === category ? 'bg-indigo-600 text-white' : 'bg-zinc-800 text-zinc-400'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm text-zinc-400 mb-2">Muscle Groups *</p>
          <div className="flex flex-wrap gap-1.5">
            {muscleGroups.map((mg) => (
              <button
                key={mg}
                onClick={() => toggleMuscle(mg)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  selectedMuscles.includes(mg) ? 'bg-indigo-600 text-white' : 'bg-zinc-800 text-zinc-400'
                }`}
              >
                {muscleGroupLabel(mg)}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm text-zinc-400 mb-2">Equipment</p>
          <div className="flex flex-wrap gap-1.5">
            {equipmentList.map((eq) => (
              <button
                key={eq}
                onClick={() => toggleEquipment(eq)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-colors ${
                  selectedEquipment.includes(eq) ? 'bg-indigo-600 text-white' : 'bg-zinc-800 text-zinc-400'
                }`}
              >
                {eq}
              </button>
            ))}
          </div>
        </div>

        <Button
          onClick={handleCreate}
          disabled={!name.trim() || selectedMuscles.length === 0}
          className="w-full"
        >
          Create Exercise
        </Button>
      </div>
    </BottomSheet>
  );
}
